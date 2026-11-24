import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DemoIdentity, DemoRole } from './demo-identity';

export const requireDemoRole = (role: DemoRole): CanActivateFn => () => {
  const identity = inject(DemoIdentity);
  return identity.current().role === role || inject(Router).parseUrl(identity.home());
};
