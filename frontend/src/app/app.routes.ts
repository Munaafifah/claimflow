import { inject } from '@angular/core';
import { RedirectFunction, Routes } from '@angular/router';
import { DemoIdentity } from './core/identity/demo-identity';
import { requireDemoRole } from './core/identity/portal.guard';
import { WorkspacePreview } from './features/workspace-preview/workspace-preview';
import { ClaimantClaims } from './features/claimant/claimant-claims/claimant-claims';
import { ClaimDetail } from './features/claimant/claim-detail/claim-detail';
import { SubmitClaim } from './features/claimant/submit-claim/submit-claim';

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
  { path: 'officer', canActivate: [requireDemoRole('officer')], component: WorkspacePreview, title: 'Officer · ClaimFlow', data: { view: 'officer' } },
  { path: 'management', canActivate: [requireDemoRole('officer')], component: WorkspacePreview, title: 'Management · ClaimFlow', data: { view: 'management' } },
  { path: '**', redirectTo: home },
];
