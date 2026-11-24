import { Claim, ClaimAction } from '../../../core/models/claim';

export type OfficerAction = Exclude<ClaimAction, 'SUPPLY_INFO'>;

export const ACTION_LABELS: Record<OfficerAction, string> = {
  PICK_UP: 'Pick up claim',
  REQUEST_INFO: 'Request information',
  RESUME_REVIEW: 'Resume review',
  APPROVE: 'Approve',
  REJECT: 'Reject',
  SETTLE: 'Record settlement',
};

export function availableOfficerActions(claim: Pick<Claim, 'status' | 'officerId'>, officerId: string): OfficerAction[] {
  if (claim.status === 'SUBMITTED' && claim.officerId === null) return ['PICK_UP'];
  if (claim.officerId !== officerId) return [];
  switch (claim.status) {
    case 'UNDER_REVIEW': return ['REQUEST_INFO', 'APPROVE', 'REJECT'];
    case 'INFO_RECEIVED': return ['RESUME_REVIEW'];
    case 'APPROVED': return ['SETTLE'];
    default: return [];
  }
}

function scaledAmount(value: string): bigint {
  const [whole, decimals = ''] = value.split('.');
  return BigInt(whole + decimals.padEnd(4, '0'));
}

export function approvalAmountError(value: string, claim: Pick<Claim, 'currency' | 'requestedAmount'>): string {
  const amount = value.trim();
  if (!/^\d{1,14}(\.\d{1,4})?$/.test(amount) || !/[1-9]/.test(amount)) {
    return 'Enter a positive amount with at most 14 digits before the decimal point.';
  }
  const precision = new Intl.NumberFormat('en', { style: 'currency', currency: claim.currency })
    .resolvedOptions().maximumFractionDigits ?? 2;
  if ((amount.split('.')[1]?.length ?? 0) > precision) {
    return precision ? `Use at most ${precision} decimal places for ${claim.currency}.` : `Enter a whole amount for ${claim.currency}.`;
  }
  return scaledAmount(amount) > scaledAmount(claim.requestedAmount)
    ? 'The approved amount must be at most the requested amount.'
    : '';
}
