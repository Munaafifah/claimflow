import { ClaimStatus } from '../../../core/models/claim';
import { Dashboard, PerformanceRange } from '../../../core/models/dashboard';

export function statusDistribution(rows: Dashboard['outstandingClaims']) {
  const counts = new Map<ClaimStatus, number>();
  for (const { status, count } of rows) counts.set(status, (counts.get(status) ?? 0) + count);
  return [...counts].map(([status, count]) => ({ status, count }));
}

function utcDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

// The selected end day is inclusive. The API's instant upper bound is exclusive.
export function performanceRange(startDay: string, endDay: string): PerformanceRange | null {
  const start = utcDate(startDay);
  const end = utcDate(endDay);
  if (!start || !end || start > end) return null;
  end.setUTCDate(end.getUTCDate() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
}

export function formatResolution(seconds: number | null): string {
  if (seconds === null) return '—';
  if (seconds < 1) return seconds === 0 ? '0s' : '<1s';
  const rounded = Math.round(seconds);
  const days = Math.floor(rounded / 86400);
  const hours = Math.floor(rounded / 3600) % 24;
  const minutes = Math.floor(rounded / 60) % 60;
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${rounded % 60}s`;
  return `${rounded}s`;
}
