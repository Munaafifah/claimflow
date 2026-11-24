import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { ClaimHistory as HistoryEntry } from '../../../core/models/claim';
import { StatusBadge } from '../status-badge/status-badge';

@Component({
  selector: 'app-claim-history',
  imports: [DatePipe, StatusBadge],
  templateUrl: './claim-history.html',
  styleUrl: './claim-history.scss',
})
export class ClaimHistory {
  readonly entries = input.required<HistoryEntry[]>();
  protected readonly labels: Record<HistoryEntry['action'], string> = {
    SUBMIT: 'Claim submitted',
    PICK_UP: 'Assigned to an officer',
    REQUEST_INFO: 'Additional information requested',
    SUPPLY_INFO: 'Additional information received',
    RESUME_REVIEW: 'Review resumed',
    APPROVE: 'Claim approved',
    REJECT: 'Claim rejected',
    SETTLE: 'Settlement recorded',
  };
}
