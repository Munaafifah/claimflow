import { Component, input } from '@angular/core';

const paths = {
  shield: 'M12 22s7-3 7-10V5l-7-3-7 3v7c0 7 7 10 7 10z M9 12l2 2 4-4',
  overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  claims: 'M7 3h8l4 4v14H5V3h2 M14 3v5h5 M8 12h8 M8 16h6',
  team: 'M3 20h18 M5 17v-4h3v4 M10 17V9h3v8 M15 17V5h3v12',
  refresh: 'M20 7v5h-5 M20 12a8 8 0 1 0-2 5.3',
  inbox: 'M4 4h16l2 11v5H2v-5z M2 15h6l2 2h4l2-2h6',
  check: 'M5 12l4 4L19 6',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 7v5l3 2',
};

@Component({
  selector: 'app-icon',
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="paths[name()]" /></svg>`,
  styles: ':host {display:inline-flex; inline-size:1.25rem; block-size:1.25rem; flex:none} svg {width:100%; height:100%}',
})
export class Icon {
  readonly name = input.required<keyof typeof paths>();
  protected readonly paths = paths;
}
