import { ValidatorFn } from '@angular/forms';
import { Market } from '../../core/models/claim';

export const MARKETS: ReadonlyArray<{ code: Market; name: string; currency: string }> = [
  { code: 'MY', name: 'Malaysia', currency: 'MYR' },
  { code: 'SG', name: 'Singapore', currency: 'SGD' },
  { code: 'TH', name: 'Thailand', currency: 'THB' },
  { code: 'ID', name: 'Indonesia', currency: 'IDR' },
  { code: 'PH', name: 'Philippines', currency: 'PHP' },
  { code: 'VN', name: 'Vietnam', currency: 'VND' },
];

export function todayLocal(): string {
  const now = new Date();
  return [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map(value => String(value).padStart(2, '0')).join('-');
}

export const incidentDate: ValidatorFn = control => {
  const value = control.value;
  if (!value) return null;
  const parsed = new Date(value + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== value) return { date: true };
  return value <= todayLocal() ? null : { future: true };
};

export const currencyScale: ValidatorFn = form => {
  const amount: string = form.get('requestedAmount')?.value ?? '';
  const currency: string = form.get('currency')?.value ?? '';
  const decimals = amount.trim().split('.')[1]?.length ?? 0;
  return decimals <= (currency === 'VND' ? 0 : 2) ? null : { currencyScale: true };
};
