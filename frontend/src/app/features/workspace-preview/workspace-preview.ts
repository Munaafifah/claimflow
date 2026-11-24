import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { catchError, combineLatest, map, of, startWith, Subject, switchMap } from 'rxjs';
import { describeApiError } from '../../core/api/api-error';
import { ClaimsApi } from '../../core/api/claims-api';
import { DashboardApi } from '../../core/api/dashboard-api';
import { DemoIdentity } from '../../core/identity/demo-identity';
import { Claim } from '../../core/models/claim';
import { Dashboard } from '../../core/models/dashboard';
import { Icon } from '../../shared/components/icon/icon';
import { PageState } from '../../shared/components/page-state/page-state';
import { StatisticCard } from '../../shared/components/statistic-card/statistic-card';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';

type View = 'claimant' | 'officer' | 'management';
type Preview =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'claims'; claims: Claim[] }
  | { kind: 'dashboard'; dashboard: Dashboard };

@Component({
  selector: 'app-workspace-preview',
  imports: [DatePipe, Icon, PageState, StatisticCard, StatusBadge],
  templateUrl: './workspace-preview.html',
  styleUrl: './workspace-preview.scss',
})
export class WorkspacePreview {
  private readonly route = inject(ActivatedRoute);
  private readonly identity = inject(DemoIdentity);
  private readonly claims = inject(ClaimsApi);
  private readonly dashboard = inject(DashboardApi);
  private readonly refreshRequests = new Subject<void>();
  protected readonly view = this.route.snapshot.data['view'] as View;
  protected readonly copy = {
    claimant: { title: 'Claim overview', description: 'Keep track of the claims you’ve submitted.', list: 'Recent claims' },
    officer: { title: 'Officer workspace', description: 'See the latest claims submitted for pickup.', list: 'Incoming claims' },
    management: { title: 'Management', description: 'See the current workload across the claims team.', list: '' },
  }[this.view];
  protected readonly state = toSignal(
    combineLatest([toObservable(this.identity.current), this.refreshRequests.pipe(startWith(undefined))]).pipe(
      switchMap(() => this.load().pipe(
        catchError(error => of<Preview>({ kind: 'error', message: describeApiError(error) })),
        startWith<Preview>({ kind: 'loading' }),
      )),
    ),
    { initialValue: { kind: 'loading' } as Preview },
  );

  protected refresh(): void {
    this.refreshRequests.next();
  }

  private load() {
    if (this.view === 'management') {
      return this.dashboard.report().pipe(map((dashboard): Preview => ({ kind: 'dashboard', dashboard })));
    }
    const incoming = this.view === 'officer';
    return this.claims.list(incoming ? { status: 'SUBMITTED' } : {}).pipe(
      map((claims): Preview => ({ kind: 'claims', claims: incoming ? claims.filter(claim => claim.officerId === null) : claims })),
    );
  }
}
