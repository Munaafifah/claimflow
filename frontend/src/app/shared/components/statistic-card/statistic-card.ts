import { Component, input } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-statistic-card',
  imports: [Icon],
  template: `<article class="surface">
    <span class="glyph"><app-icon [name]="icon()" /></span>
    <div><p>{{ label() }}</p><strong>{{ value() }}</strong></div>
  </article>`,
  styles: `
    article { display:flex; align-items:center; gap:1rem; min-width:0; padding:1.05rem 1.15rem }
    .glyph { display:grid; place-items:center; inline-size:2.65rem; block-size:2.65rem; border-radius:.75rem; background:var(--indigo-light); color:var(--primary); flex:none }
    p { margin:0 0 .1rem; color:var(--muted); font-size:.875rem }
    strong { font-size:1.65rem; line-height:1.2; font-variant-numeric:tabular-nums }
  `,
})
export class StatisticCard {
  readonly label = input.required<string>();
  readonly value = input.required<number | string>();
  readonly icon = input.required<'claims' | 'clock' | 'check' | 'inbox'>();
}
