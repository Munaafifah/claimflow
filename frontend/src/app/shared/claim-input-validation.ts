import { ValidatorFn } from '@angular/forms';

export const nonBlank: ValidatorFn = control =>
  typeof control.value === 'string' && control.value.trim() ? null : { required: true };

export const positiveAmount: ValidatorFn = control => {
  const value: string = control.value.trim();
  if (!value) return { required: true };
  return /^\d{1,14}(\.\d{1,4})?$/.test(value) && /[1-9]/.test(value) ? null : { amount: true };
};
