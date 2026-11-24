import { Component, input } from '@angular/core';
import { ClaimStatus } from '../../../core/models/claim';

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under review', INFO_REQUIRED: 'Info needed',
  INFO_RECEIVED: 'Info received', APPROVED: 'Approved', REJECTED: 'Rejected', SETTLED: 'Settled',
};

@Component({
  selector: 'app-status-badge',
  template: '<span [attr.data-status]="status()">{{ labels[status()] }}</span>',
  styles: `
    span { display:inline-block; border-radius:999px; padding:.23rem .65rem; background:#eef2ff; color:#3730a3; font-size:.8rem; font-weight:650; white-space:nowrap }
    span[data-status=INFO_REQUIRED] { background:#fff7ed; color:#9a3412 }
    span[data-status=REJECTED] { background:#fef2f2; color:#991b1b }
    span[data-status=APPROVED], span[data-status=SETTLED] { background:#ecfdf5; color:#065f46 }
  `,
})
export class StatusBadge {
  readonly status = input.required<ClaimStatus>();
  protected readonly labels = CLAIM_STATUS_LABELS;
}
