import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { DemoIdentity } from './demo-identity';

export const demoIdentityInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith('/api/')) return next(request);
  const actor = inject(DemoIdentity).current();
  return next(request.clone({ setHeaders: { 'X-Demo-User-Id': actor.id } }));
};
