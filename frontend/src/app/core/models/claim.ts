export type ClaimType = 'MOTOR' | 'PROPERTY';
export type Market = 'MY' | 'SG' | 'TH' | 'ID' | 'PH' | 'VN';
export type ClaimStatus =
  | 'SUBMITTED' | 'UNDER_REVIEW' | 'INFO_REQUIRED' | 'INFO_RECEIVED'
  | 'APPROVED' | 'REJECTED' | 'SETTLED';
export type ClaimAction =
  | 'PICK_UP' | 'REQUEST_INFO' | 'SUPPLY_INFO' | 'RESUME_REVIEW'
  | 'APPROVE' | 'REJECT' | 'SETTLE';

export interface CreateClaim {
  type: ClaimType;
  market: Market;
  incidentDate: string;
  description: string;
  requestedAmount: string;
  currency: string;
}

export type ClaimCommand =
  | { action: 'PICK_UP' | 'RESUME_REVIEW' | 'SETTLE' }
  | { action: 'REQUEST_INFO' | 'SUPPLY_INFO' | 'REJECT'; message: string }
  | { action: 'APPROVE'; message: string; approvedAmount: string };

export interface ClaimHistory {
  actorId: string;
  action: ClaimAction | 'SUBMIT';
  previousStatus: ClaimStatus | null;
  status: ClaimStatus;
  message: string | null;
  occurredAt: string;
}

export interface Claim extends CreateClaim {
  id: number;
  claimantId: string;
  officerId: string | null;
  status: ClaimStatus;
  approvedAmount: string | null;
  createdAt: string;
  updatedAt: string;
  history: ClaimHistory[];
}
