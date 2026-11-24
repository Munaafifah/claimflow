import { Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-page-state',
  imports: [Icon],
  template: `<div [attr.role]="kind() === 'error' ? 'alert' : 'status'">
    @if (kind() === 'loading') {
      <span class="spinner" aria-hidden="true"></span>
    } @else {
      <app-icon name="inbox" />
    }
    <p>{{ message() }}</p>
    @if (kind() === 'error') {
      <button type="button" class="button" (click)="retry.emit()">Try again</button>
    }
  </div>`,
  styles: `
    div { display:grid; justify-items:center; gap:.55rem; text-align:center; padding:2rem 1rem; color:var(--muted) }
    p { margin:0; }
    app-icon { color:var(--primary) }
    .spinner { width:1.3rem; height:1.3rem; border:2px solid var(--indigo-light); border-top-color:var(--primary); border-radius:50%; animation:spin .7s linear infinite }
    @keyframes spin { to { transform:rotate(360deg) } }
    @media (prefers-reduced-motion:reduce) { .spinner { animation:none } }
  `,
})
export class PageState {
  readonly kind = input.required<'loading' | 'empty' | 'error'>();
  readonly message = input.required<string>();
  readonly retry = output<void>();
}
