import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { describeApiError } from '../../../core/api/api-error';
import { ClaimsApi } from '../../../core/api/claims-api';
import { DemoIdentity } from '../../../core/identity/demo-identity';
import { Claim, ClaimType, Market } from '../../../core/models/claim';
import { currencyScale, incidentDate, MARKETS, nonBlank, positiveAmount, todayLocal } from '../claim-form-validation';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './submit-claim.html',
  styleUrls: ['../claimant-styles.scss', './submit-claim.scss'],
})
export class SubmitClaim {
  private readonly builder = inject(FormBuilder).nonNullable;
  private readonly api = inject(ClaimsApi);
  private readonly identity = inject(DemoIdentity);
  private readonly router = inject(Router);
  protected readonly markets = MARKETS;
  protected readonly today = todayLocal();
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly uncertain = signal(false);
  protected readonly form = this.builder.group({
    type: this.builder.control<ClaimType | ''>('', Validators.required),
    market: this.builder.control<Market | ''>('', Validators.required),
    incidentDate: ['', [Validators.required, incidentDate]],
    description: ['', [nonBlank, Validators.maxLength(2000)]],
    requestedAmount: ['', positiveAmount],
    currency: ['', Validators.required],
  }, { validators: currencyScale });
  private readonly submitRequests = takeUntilDestroyed<Claim>();

  constructor() {
    effect(() => {
      this.identity.current();
      this.form.reset();
      this.error.set('');
      this.uncertain.set(false);
    });
  }

  protected selectMarket(market: string): void {
    const currency = this.markets.find(item => item.code === market)?.currency;
    if (currency) this.form.controls.currency.setValue(currency);
  }

  protected submit(): void {
    if (this.busy() || this.uncertain()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    if (!value.type || !value.market) return;
    const actorId = this.identity.current().id;
    this.error.set('');
    this.busy.set(true);
    this.api.submit({
      ...value, type: value.type, market: value.market,
      description: value.description.trim(), requestedAmount: value.requestedAmount.trim(),
    }).pipe(this.submitRequests, finalize(() => this.busy.set(false))).subscribe({
      next: claim => {
        if (actorId === this.identity.current().id) {
          void this.router.navigate(['/claimant/claims', claim.id]);
        }
      },
      error: error => {
        if (actorId !== this.identity.current().id) return;
        const uncertain = !(error instanceof HttpErrorResponse) || error.status === 0 || error.status >= 500;
        this.uncertain.set(uncertain);
        this.error.set(uncertain
          ? 'We couldn’t confirm submission. Check My Claims before submitting again.'
          : describeApiError(error));
      },
    });
  }
}
