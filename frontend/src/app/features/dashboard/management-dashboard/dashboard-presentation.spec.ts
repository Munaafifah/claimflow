import { describe, expect, it } from 'vitest';
import { formatResolution, performanceRange, statusDistribution } from './dashboard-presentation';

describe('Dashboard presentation', () => {
  it('includes the full final UTC day and supports a same-day filter', () => {
    expect(performanceRange('2024-02-29', '2024-02-29')).toEqual({
      from: '2024-02-29T00:00:00.000Z',
      to: '2024-03-01T00:00:00.000Z',
    });
  });

  it('rejects missing, invalid and reversed date bounds', () => {
    expect(performanceRange('2025-01-01', '')).toBeNull();
    expect(performanceRange('2025-02-29', '2025-03-02')).toBeNull();
    expect(performanceRange('2025-02-01', '2025-01-31')).toBeNull();
  });

  it('groups outstanding report counts for display without including performance outcomes', () => {
    expect(statusDistribution([
      { market: 'MY', type: 'MOTOR', status: 'SUBMITTED', count: 2 },
      { market: 'SG', type: 'PROPERTY', status: 'SUBMITTED', count: 3 },
      { market: 'MY', type: 'MOTOR', status: 'APPROVED', count: 1 },
    ])).toEqual([{ status: 'SUBMITTED', count: 5 }, { status: 'APPROVED', count: 1 }]);
    expect(statusDistribution([])).toEqual([]);
  });

  it('formats missing, sub-second and longer resolution times', () => {
    expect(formatResolution(null)).toBe('—');
    expect(formatResolution(0.125)).toBe('<1s');
    expect(formatResolution(3670)).toBe('1h 1m');
    expect(formatResolution(90)).toBe('1m 30s');
  });
});
