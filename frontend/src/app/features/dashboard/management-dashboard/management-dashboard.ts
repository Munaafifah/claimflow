import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { catchError, combineLatest, exhaustMap, map, merge, of, scan, startWith, Subject, switchMap, timer } from 'rxjs';
import { describeApiError } from '../../../core/api/api-error';
import { DashboardApi } from '../../../core/api/dashboard-api';
import { DemoIdentity } from '../../../core/identity/demo-identity';
import { ClaimStatus } from '../../../core/models/claim';
import { Dashboard, PerformanceRange } from '../../../core/models/dashboard';
import { Icon } from '../../../shared/components/icon/icon';
import { PageState } from '../../../shared/components/page-state/page-state';
import { StatisticCard } from '../../../shared/components/statistic-card/statistic-card';
import { CLAIM_STATUS_LABELS, StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { formatResolution, performanceRange, statusDistribution } from './dashboard-presentation';

type ReportEvent =
  | { kind: 'loading' }
  | { kind: 'success'; data: Dashboard; updatedAt: number }
  | { kind: 'error'; message: string };
type ReportState = { loading: boolean; data: Dashboard | null; updatedAt: number | null; error: string };

const initial: ReportState = { loading: true, data: null, updatedAt: null, error: '' };
const refreshInterval = 30_000;

@Component({
  imports: [DatePipe, ReactiveFormsModule, Icon, PageState, StatisticCard, StatusBadge],
  templateUrl: './management-dashboard.html',
  styleUrls: ['../../../shared/workflow-page.scss', './management-dashboard.scss'],
})
export class ManagementDashboard {
  private readonly api = inject(DashboardApi);
  private readonly identity = inject(DemoIdentity);
  private readonly refreshRequests = new Subject<void>();
  private readonly range = signal<PerformanceRange | null>(null);
  protected readonly rangeError = signal('');
  protected readonly dateForm = inject(FormBuilder).nonNullable.group({ startDay: '', endDay: '' });
  protected readonly statusLabels = CLAIM_STATUS_LABELS;
  protected readonly statuses = Object.keys(CLAIM_STATUS_LABELS) as ClaimStatus[];
  protected readonly resolution = formatResolution;

  protected readonly state = toSignal(
    combineLatest([toObservable(this.identity.current), toObservable(this.range)]).pipe(
      switchMap(([, range]) => merge(timer(0, refreshInterval), this.refreshRequests).pipe(
        exhaustMap(() => this.api.report(range ?? undefined).pipe(
          map((data): ReportEvent => ({ kind: 'success', data, updatedAt: Date.now() })),
          catchError(error => of<ReportEvent>({ kind: 'error', message: describeApiError(error) })),
          startWith<ReportEvent>({ kind: 'loading' }),
        )),
        scan((state: ReportState, event: ReportEvent): ReportState => {
          switch (event.kind) {
            case 'loading': return { ...state, loading: true };
            case 'success': return { loading: false, data: event.data, updatedAt: event.updatedAt, error: '' };
            case 'error': return { ...state, loading: false, error: event.message };
          }
        }, initial),
        startWith(initial),
      )),
    ),
    { initialValue: initial },
  );

  protected readonly distribution = computed(() => statusDistribution(this.state().data?.outstandingClaims ?? []));
  protected readonly workloadMax = computed(() =>
    Math.max(1, ...(this.state().data?.officerWorkload ?? []).map(officer => officer.active)));

  protected refresh(): void { this.refreshRequests.next(); }

  protected applyDates(): void {
    const { startDay, endDay } = this.dateForm.getRawValue();
    const range = performanceRange(startDay, endDay);
    if (!range) {
      this.rangeError.set('Choose both UTC dates, with the end date on or after the start date.');
      return;
    }
    this.rangeError.set('');
    this.range.set(range);
  }

  protected clearDates(): void {
    this.dateForm.reset();
    this.rangeError.set('');
    this.range.set(null);
  }
}
