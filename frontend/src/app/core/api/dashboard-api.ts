import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Dashboard, PerformanceRange } from '../models/dashboard';

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);

  report(range?: PerformanceRange) {
    return this.http.get<Dashboard>('/api/dashboard', {
      params: range ? { from: range.from, to: range.to } : {},
    });
  }
}
