import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, combineLatest, distinctUntilChanged, map, of, startWith, Subject, switchMap } from 'rxjs';
import { describeApiError } from '../../../core/api/api-error';
import { ClaimsApi } from '../../../core/api/claims-api';
import { DemoIdentity } from '../../../core/identity/demo-identity';
import { Claim } from '../../../core/models/claim';
import { Icon } from '../../../shared/components/icon/icon';
import { PageState } from '../../../shared/components/page-state/page-state';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

type WorklistState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; claims: Claim[] };

@Component({
  imports: [DatePipe, RouterLink, Icon, PageState, StatusBadge],
  templateUrl: './officer-worklist.html',
  styleUrls: ['../../../shared/workflow-page.scss', './officer-worklist.scss'],
})
export class OfficerWorklist {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ClaimsApi);
  private readonly identity = inject(DemoIdentity);
  private readonly reload = new Subject<void>();
  private readonly assignedView = this.route.queryParamMap.pipe(
    map(params => params.get('view') === 'assigned'), distinctUntilChanged(),
  );
  protected readonly assigned = toSignal(this.assignedView, { initialValue: false });
  protected readonly state = toSignal(
    combineLatest([this.assignedView, toObservable(this.identity.current), this.reload.pipe(startWith(undefined))]).pipe(
      switchMap(([assigned, actor]) => this.api.list(assigned ? { officerId: actor.id } : { status: 'SUBMITTED' }).pipe(
        map((claims): WorklistState => ({
          kind: 'ready', claims: assigned ? claims : claims.filter(claim => claim.officerId === null),
        })),
        catchError(error => of<WorklistState>({ kind: 'error', message: describeApiError(error) })),
        startWith<WorklistState>({ kind: 'loading' }),
      )),
    ),
    { initialValue: { kind: 'loading' } as WorklistState },
  );

  protected refresh(): void { this.reload.next(); }
}
