import { inject } from '@angular/core';
import { RedirectFunction, Routes } from '@angular/router';
import { DemoIdentity } from './core/identity/demo-identity';
import { requireDemoRole } from './core/identity/portal.guard';
import { WorkspacePreview } from './features/workspace-preview/workspace-preview';

const home: RedirectFunction = () => inject(DemoIdentity).home();

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: home },
  { path: 'claimant', canActivate: [requireDemoRole('claimant')], component: WorkspacePreview, title: 'Claimant · ClaimFlow', data: { view: 'claimant' } },
  { path: 'officer', canActivate: [requireDemoRole('officer')], component: WorkspacePreview, title: 'Officer · ClaimFlow', data: { view: 'officer' } },
  { path: 'management', canActivate: [requireDemoRole('officer')], component: WorkspacePreview, title: 'Management · ClaimFlow', data: { view: 'management' } },
  { path: '**', redirectTo: home },
];
