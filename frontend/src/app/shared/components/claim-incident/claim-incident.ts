import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { Claim } from '../../../core/models/claim';

@Component({
  selector: 'app-claim-incident',
  imports: [DatePipe],
  templateUrl: './claim-incident.html',
  styleUrls: ['../../workflow-page.scss', './claim-incident.scss'],
})
export class ClaimIncident {
  readonly claim = input.required<Claim>();
  readonly showClaimant = input(false);
}
