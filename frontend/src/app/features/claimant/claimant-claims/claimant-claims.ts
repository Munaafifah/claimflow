import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, combineLatest, map, of, startWith, Subject, switchMap } from 'rxjs';
import { describeApiError } from '../../../core/api/api-error';
import { ClaimsApi } from '../../../core/api/claims-api';
import { DemoIdentity } from '../../../core/identity/demo-identity';
import { Claim, ClaimStatus, ClaimType } from '../../../core/models/claim';
import { Icon } from '../../../shared/components/icon/icon';
import { PageState } from '../../../shared/components/page-state/page-state';
import { StatisticCard } from '../../../shared/components/statistic-card/statistic-card';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

type ClaimsState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; claims: Claim[] };

@Component({
  imports: [DatePipe, RouterLink, Icon, PageState, StatisticCard, StatusBadge],
  templateUrl: './claimant-claims.html',
  styleUrls: ['../claimant-styles.scss', './claimant-claims.scss'],
})
export class ClaimantClaims {
  private readonly api = inject(ClaimsApi);
  private readonly identity = inject(DemoIdentity);
  private readonly reload = new Subject<void>();
  protected readonly overview = inject(ActivatedRoute).snapshot.data['overview'] === true;
  protected readonly status = signal<ClaimStatus | ''>('');
  protected readonly type = signal<ClaimType | ''>('');
  protected readonly statuses = Object.entries({
    SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under review', INFO_REQUIRED: 'Info needed',
    INFO_RECEIVED: 'Info received', APPROVED: 'Approved', REJECTED: 'Rejected', SETTLED: 'Settled',
  });

  protected readonly state = toSignal(
    combineLatest([toObservable(this.identity.current), this.reload.pipe(startWith(undefined))]).pipe(
      switchMap(() => this.api.list().pipe(
        map((claims): ClaimsState => ({ kind: 'ready', claims })),
        catchError(error => of<ClaimsState>({ kind: 'error', message: describeApiError(error) })),
        startWith<ClaimsState>({ kind: 'loading' }),
      )),
    ),
    { initialValue: { kind: 'loading' } as ClaimsState },
  );

  protected readonly visibleClaims = computed(() => {
    const state = this.state();
    if (state.kind !== 'ready') return [];
    if (this.overview) return state.claims.slice(0, 6);
    return state.claims.filter(claim =>
      (!this.status() || claim.status === this.status()) && (!this.type() || claim.type === this.type()));
  });

  protected readonly summary = computed(() => {
    const state = this.state();
    const total = state.kind === 'ready' ? state.claims.length : 0;
    let needsAction = 0;
    let completed = 0;
    if (state.kind === 'ready') {
      for (const claim of state.claims) {
        if (claim.status === 'INFO_REQUIRED') needsAction++;
        if (claim.status === 'SETTLED' || claim.status === 'REJECTED') completed++;
      }
    }
    return { total, inProgress: total - needsAction - completed, needsAction, completed };
  });

  protected refresh(): void { this.reload.next(); }
}
