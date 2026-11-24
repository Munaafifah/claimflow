import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, combineLatest, finalize, map, of, startWith, Subject, switchMap } from 'rxjs';
import { ClaimsApi } from '../../../core/api/claims-api';
import { describeApiError } from '../../../core/api/api-error';
import { DemoIdentity } from '../../../core/identity/demo-identity';
import { Claim, ClaimCommand } from '../../../core/models/claim';
import { nonBlank } from '../../../shared/claim-input-validation';
import { ClaimHistory } from '../../../shared/components/claim-history/claim-history';
import { ClaimIncident } from '../../../shared/components/claim-incident/claim-incident';
import { PageState } from '../../../shared/components/page-state/page-state';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { ACTION_LABELS, approvalAmountError, availableOfficerActions, OfficerAction } from './officer-actions';

type ReviewState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; claim: Claim };

@Component({
  imports: [ReactiveFormsModule, RouterLink, ClaimHistory, ClaimIncident, PageState, StatusBadge],
  templateUrl: './review-claim.html',
  styleUrls: ['../../../shared/workflow-page.scss', './review-claim.scss'],
})
export class ReviewClaim {
  private readonly api = inject(ClaimsApi);
  protected readonly identity = inject(DemoIdentity);
  private readonly reload = new Subject<void>();
  private readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map(params => {
    const path = params.get('id') ?? '';
    const id = Number(path);
    return /^\d+$/.test(path) && Number.isSafeInteger(id) && id > 0 ? id : null;
  })), { initialValue: null });
  private readonly writeRequests = takeUntilDestroyed<Claim>();
  protected readonly labels = ACTION_LABELS;
  protected readonly selected = signal<OfficerAction | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly form = inject(FormBuilder).nonNullable.group({
    message: ['', [nonBlank, Validators.maxLength(2000)]],
    amount: [''],
  });
  protected readonly amountError = signal('');
  protected readonly state = toSignal(
    combineLatest([toObservable(this.id), toObservable(this.identity.current), this.reload.pipe(startWith(undefined))]).pipe(
      switchMap(([id]) => id === null
        ? of<ReviewState>({ kind: 'error', message: 'This claim link is invalid.' })
        : this.api.detail(id).pipe(
            map((claim): ReviewState => ({ kind: 'ready', claim })),
            catchError(error => of<ReviewState>({ kind: 'error', message: describeApiError(error) })),
            startWith<ReviewState>({ kind: 'loading' }),
          )),
    ),
    { initialValue: { kind: 'loading' } as ReviewState },
  );
  protected readonly actions = computed(() => {
    const current = this.state();
    return current.kind === 'ready' ? availableOfficerActions(current.claim, this.identity.current().id) : [];
  });

  constructor() {
    effect(() => {
      this.id();
      this.identity.current();
      this.cancel();
      this.error.set('');
      this.notice.set('');
    });
  }

  protected refresh(): void { this.reload.next(); }

  protected choose(action: OfficerAction): void {
    if (this.busy() || !this.actions().includes(action)) return;
    this.cancel();
    this.error.set('');
    this.notice.set('');
    if (action === 'PICK_UP' || action === 'RESUME_REVIEW') {
      this.act({ action });
    } else {
      this.selected.set(action);
    }
  }

  protected cancel(): void {
    this.selected.set(null);
    this.form.reset();
    this.amountError.set('');
  }

  protected confirm(): void {
    const action = this.selected();
    const current = this.state();
    if (action === null || current.kind !== 'ready' || !this.actions().includes(action) || this.busy()) return;
    if (action === 'SETTLE') {
      this.act({ action });
      return;
    }
    if (action === 'PICK_UP' || action === 'RESUME_REVIEW') return;
    this.form.controls.message.markAsTouched();
    const { message, amount } = this.form.getRawValue();
    if (action === 'APPROVE') {
      const amountIssue = approvalAmountError(amount, current.claim);
      this.amountError.set(amountIssue);
      if (amountIssue || this.form.controls.message.invalid) return;
      this.act({ action, message: message.trim(), approvedAmount: amount.trim() });
    } else if (this.form.controls.message.valid) {
      this.act({ action, message: message.trim() });
    }
  }

  private act(command: ClaimCommand): void {
    const state = this.state();
    if (state.kind !== 'ready') return;
    const id = state.claim.id;
    const officer = this.identity.current().id;
    const stillViewing = () => this.id() === id && this.identity.current().id === officer;
    this.busy.set(true);
    this.error.set('');
    this.api.act(id, command).pipe(this.writeRequests, finalize(() => this.busy.set(false))).subscribe({
      next: claim => {
        if (!stillViewing()) return;
        this.cancel();
        this.notice.set(`Claim #${claim.id} updated.`);
        this.refresh();
      },
      error: error => {
        if (!stillViewing()) return;
        this.error.set(describeApiError(error));
        if (!(error instanceof HttpErrorResponse) || error.status !== 400) {
          this.cancel();
          this.refresh();
        }
      },
    });
  }
}
