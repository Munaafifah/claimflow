import { FormControl, FormGroup } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { currencyScale, incidentDate, todayLocal } from './claim-form-validation';
import { nonBlank, positiveAmount } from '../../shared/claim-input-validation';

describe('Claimant form validation', () => {
  it('rejects whitespace-only descriptions and replies', () => {
    expect(nonBlank(new FormControl(' \n '))).toEqual({ required: true });
    expect(nonBlank(new FormControl(' Estimate attached '))).toBeNull();
  });

  it('checks that the incident date exists and is on or before today', () => {
    expect(incidentDate(new FormControl('2025-02-30'))).toEqual({ date: true });
    expect(incidentDate(new FormControl('9999-12-31'))).toEqual({ future: true });
    expect(incidentDate(new FormControl(todayLocal()))).toBeNull();
  });

  it('accepts positive decimal strings within the API length limit', () => {
    for (const invalid of ['0.00', '-1', '1e2', '123456789012345', '1.12345']) {
      expect(positiveAmount(new FormControl(invalid))).toEqual({ amount: true });
    }
    expect(positiveAmount(new FormControl('120.50'))).toBeNull();
  });

  it('checks the currency scale even when the currency changes', () => {
    const form = new FormGroup({
      requestedAmount: new FormControl('120.50', { nonNullable: true }),
      currency: new FormControl('MYR', { nonNullable: true }),
    }, { validators: currencyScale });
    expect(form.valid).toBe(true);
    form.controls.currency.setValue('VND');
    expect(form.hasError('currencyScale')).toBe(true);
    form.controls.requestedAmount.setValue('120');
    expect(form.valid).toBe(true);
  });
});
