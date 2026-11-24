import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, combineLatest, finalize, map, of, startWith, Subject, switchMap } from 'rxjs';
import { describeApiError } from '../../../core/api/api-error';
import { ClaimsApi } from '../../../core/api/claims-api';
import { DemoIdentity } from '../../../core/identity/demo-identity';
import { Claim } from '../../../core/models/claim';
import { ClaimHistory } from '../../../shared/components/claim-history/claim-history';
import { PageState } from '../../../shared/components/page-state/page-state';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { nonBlank } from '../claim-form-validation';

type DetailState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; claim: Claim };

@Component({
  imports: [DatePipe, ReactiveFormsModule, RouterLink, ClaimHistory, PageState, StatusBadge],
  templateUrl: './claim-detail.html',
  styleUrls: ['../claimant-styles.scss', './claim-detail.scss'],
})
export class ClaimDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ClaimsApi);
  private readonly identity = inject(DemoIdentity);
  private readonly reload = new Subject<void>();
  private readonly id = toSignal(this.route.paramMap.pipe(map(params => {
    const value = params.get('id') ?? '';
    const id = Number(value);
    return /^\d+$/.test(value) && Number.isSafeInteger(id) && id > 0 ? id : null;
  })), { initialValue: null });
  private readonly writeRequests = takeUntilDestroyed<Claim>();
  protected readonly reply = new FormControl('', { nonNullable: true, validators: [nonBlank, Validators.maxLength(2000)] });
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly state = toSignal(
    combineLatest([toObservable(this.id), toObservable(this.identity.current), this.reload.pipe(startWith(undefined))]).pipe(
      switchMap(([id]) => id === null
        ? of<DetailState>({ kind: 'error', message: 'This claim link is invalid.' })
        : this.api.detail(id).pipe(
            map((claim): DetailState => ({ kind: 'ready', claim })),
            catchError(error => of<DetailState>({ kind: 'error', message: describeApiError(error) })),
            startWith<DetailState>({ kind: 'loading' }),
          )),
    ),
    { initialValue: { kind: 'loading' } as DetailState },
  );
  protected readonly latestRequest = computed(() => {
    const result = this.state();
    return result.kind === 'ready' ? [...result.claim.history].reverse().find(entry => entry.action === 'REQUEST_INFO') : undefined;
  });
  protected readonly outcome = computed(() => {
    const result = this.state();
    if (result.kind !== 'ready') return undefined;
    const claim = result.claim;
    const newestFirst = [...claim.history].reverse();
    const decision = newestFirst.find(entry => entry.action === 'APPROVE' || entry.action === 'REJECT');
    const settlement = newestFirst.find(entry => entry.action === 'SETTLE');
    return decision ? { decision, settlement } : undefined;
  });

  constructor() {
    effect(() => {
      this.id();
      this.identity.current();
      this.reply.reset();
      this.error.set('');
      this.notice.set('');
    });
  }

  protected refresh(): void { this.reload.next(); }

  protected sendReply(): void {
    const result = this.state();
    if (this.busy() || result.kind !== 'ready' || result.claim.status !== 'INFO_REQUIRED') return;
    this.reply.markAsTouched();
    if (this.reply.invalid) return;
    const actor = this.identity.current().id;
    const id = result.claim.id;
    const stillViewingClaim = () => this.identity.current().id === actor && this.id() === id;
    this.busy.set(true);
    this.error.set('');
    this.notice.set('');
    this.api.act(id, { action: 'SUPPLY_INFO', message: this.reply.value.trim() })
      .pipe(this.writeRequests, finalize(() => this.busy.set(false))).subscribe({
        next: () => {
          if (!stillViewingClaim()) return;
          this.reply.reset();
          this.notice.set('Your reply was sent to the claims team.');
          this.refresh();
        },
        error: error => {
          if (!stillViewingClaim()) return;
          this.error.set(describeApiError(error));
          if (error instanceof HttpErrorResponse && error.status !== 400) this.refresh();
        },
      });
  }
}
