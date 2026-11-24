import { inject } from '@angular/core';
import { RedirectFunction, Routes } from '@angular/router';
import { DemoIdentity } from './core/identity/demo-identity';
import { requireDemoRole } from './core/identity/portal.guard';
import { WorkspacePreview } from './features/workspace-preview/workspace-preview';
import { ClaimantClaims } from './features/claimant/claimant-claims/claimant-claims';
import { ClaimDetail } from './features/claimant/claim-detail/claim-detail';
import { SubmitClaim } from './features/claimant/submit-claim/submit-claim';
import { OfficerWorklist } from './features/officer/worklist/officer-worklist';
import { ReviewClaim } from './features/officer/review-claim/review-claim';

const home: RedirectFunction = () => inject(DemoIdentity).home();

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: home },
  {
    path: 'claimant', canActivateChild: [requireDemoRole('claimant')],
    children: [
      { path: '', pathMatch: 'full', component: ClaimantClaims, title: 'Overview · ClaimFlow', data: { overview: true } },
      { path: 'claims', pathMatch: 'full', component: ClaimantClaims, title: 'My claims · ClaimFlow' },
      { path: 'claims/new', component: SubmitClaim, title: 'Submit claim · ClaimFlow' },
      { path: 'claims/:id', component: ClaimDetail, title: 'Claim detail · ClaimFlow' },
    ],
  },
  {
    path: 'officer', canActivateChild: [requireDemoRole('officer')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'claims' },
      { path: 'claims', pathMatch: 'full', component: OfficerWorklist, title: 'Claims worklist · ClaimFlow' },
      { path: 'claims/:id', component: ReviewClaim, title: 'Review claim · ClaimFlow' },
    ],
  },
  { path: 'management', canActivate: [requireDemoRole('officer')], component: WorkspacePreview, title: 'Management · ClaimFlow', data: { view: 'management' } },
  { path: '**', redirectTo: home },
];
