import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Claim, ClaimCommand, ClaimStatus, CreateClaim } from '../models/claim';

@Injectable({ providedIn: 'root' })
export class ClaimsApi {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/claims';

  list(filters: { status?: ClaimStatus; officerId?: string } = {}) {
    const params: Record<string, string> = {};
    if (filters.status) params['status'] = filters.status;
    if (filters.officerId) params['officerId'] = filters.officerId;
    return this.http.get<Claim[]>(this.url, { params });
  }

  detail(id: number) {
    return this.http.get<Claim>(`${this.url}/${id}`);
  }

  submit(claim: CreateClaim) {
    return this.http.post<Claim>(this.url, claim);
  }

  act(id: number, command: ClaimCommand) {
    return this.http.post<Claim>(`${this.url}/${id}/actions`, command);
  }
}
