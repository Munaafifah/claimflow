import { describe, expect, it } from 'vitest';
import { ClaimStatus } from '../../../core/models/claim';
import { approvalAmountError, availableOfficerActions, OfficerAction } from './officer-actions';

describe('Officer workflow', () => {
  it('only offers pickup for an unassigned submission', () => {
    expect(availableOfficerActions({ status: 'SUBMITTED', officerId: null }, 'officer-1')).toEqual(['PICK_UP']);
    expect(availableOfficerActions({ status: 'SUBMITTED', officerId: 'officer-2' }, 'officer-1')).toEqual([]);
  });

  it('offers status-specific actions only to the assigned officer', () => {
    const cases: [ClaimStatus, OfficerAction[]][] = [
      ['UNDER_REVIEW', ['REQUEST_INFO', 'APPROVE', 'REJECT']],
      ['INFO_REQUIRED', []], ['INFO_RECEIVED', ['RESUME_REVIEW']], ['APPROVED', ['SETTLE']],
      ['REJECTED', []], ['SETTLED', []],
    ];
    for (const [status, actions] of cases) {
      const claim = { status, officerId: 'officer-1' };
      expect(availableOfficerActions(claim, 'officer-1')).toEqual(actions);
      expect(availableOfficerActions(claim, 'officer-2')).toEqual([]);
    }
  });

  it('compares decimal amounts exactly and validates the currency scale', () => {
    const claim = { currency: 'MYR', requestedAmount: '99999999999999.98' };
    expect(approvalAmountError(' 99999999999999.98 ', claim)).toBe('');
    expect(approvalAmountError('99999999999999.99', claim)).toContain('at most');
    expect(approvalAmountError('1.001', claim)).toContain('2 decimal places');
    expect(approvalAmountError('0', claim)).toContain('positive');
    expect(approvalAmountError('1.2', { currency: 'VND', requestedAmount: '100' })).toContain('whole');
  });
});
