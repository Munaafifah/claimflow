import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { routes } from '../../app.routes';
import { DemoIdentity } from '../identity/demo-identity';
import { demoIdentityInterceptor } from '../identity/demo-identity.interceptor';
import { ClaimsApi } from './claims-api';
import { DashboardApi } from './dashboard-api';

describe('Portal foundation', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptors([demoIdentityInterceptor])),
        provideHttpClientTesting(),
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    sessionStorage.clear();
  });

  it('uses the selected identity and encodes the assigned-claims filter', () => {
    const identity = TestBed.inject(DemoIdentity);
    const claims = TestBed.inject(ClaimsApi);
    const http = TestBed.inject(HttpTestingController);
    claims.list().subscribe();
    const first = http.expectOne('/api/claims');
    expect(first.request.headers.get('X-Demo-User-Id')).toBe('claimant-1');
    first.flush([]);

    identity.select('officer-2');
    claims.list({ officerId: 'officer-2', status: 'UNDER_REVIEW' }).subscribe();
    const second = http.expectOne('/api/claims?status=UNDER_REVIEW&officerId=officer-2');
    expect(second.request.headers.get('X-Demo-User-Id')).toBe('officer-2');
    second.flush([]);
  });

  it('keeps decision amounts as strings and sends both performance bounds', () => {
    TestBed.inject(DemoIdentity).select('officer-1');
    const http = TestBed.inject(HttpTestingController);
    const command = { action: 'APPROVE', approvedAmount: '120.50', message: 'Covered' } as const;
    TestBed.inject(ClaimsApi).act(42, command).subscribe();
    const action = http.expectOne('/api/claims/42/actions');
    expect(action.request.method).toBe('POST');
    expect(action.request.body).toEqual(command);
    action.flush({});

    const range = { from: '2026-01-01T00:00:00Z', to: '2026-02-01T00:00:00Z' };
    TestBed.inject(DashboardApi).report(range).subscribe();
    const report = http.expectOne(request => request.url === '/api/dashboard');
    expect(report.request.params.get('from')).toBe(range.from);
    expect(report.request.params.get('to')).toBe(range.to);
    expect(report.request.headers.get('X-Demo-User-Id')).toBe('officer-1');
    report.flush({});
  });

  it('does not attach a demo identity to other URLs', () => {
    TestBed.inject(HttpClient).get('/favicon.svg').subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne('/favicon.svg');
    expect(request.request.headers.has('X-Demo-User-Id')).toBe(false);
    request.flush({});
  });

  it('redirects a claimant away from management and allows an officer in', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/management');
    expect(router.url).toBe('/claimant');
    TestBed.inject(DemoIdentity).select('officer-1');
    await router.navigateByUrl('/management');
    expect(router.url).toBe('/management');
    await router.navigateByUrl('/claimant');
    expect(router.url).toBe('/officer');
  });
});
