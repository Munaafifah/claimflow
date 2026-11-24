import { ClaimStatus, ClaimType, Market } from './claim';

export interface PerformanceRange {
  from: string;
  to: string;
}

export interface OutcomeMetrics {
  approved: number;
  settled: number;
  rejected: number;
  averageResolutionSeconds: number | null;
}

export interface Dashboard {
  summary: { total: number; unassigned: number; active: number; completed: number };
  officerWorkload: { officerId: string; active: number; byStatus: Partial<Record<ClaimStatus, number>> }[];
  outstandingClaims: { market: Market; type: ClaimType; status: ClaimStatus; count: number }[];
  exposureByCurrency: { currency: string; amount: string }[];
  performance: OutcomeMetrics & {
    from: string | null;
    to: string | null;
    byOfficer: (OutcomeMetrics & { officerId: string })[];
  };
}
