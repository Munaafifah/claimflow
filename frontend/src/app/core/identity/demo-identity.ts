import { computed, Injectable, signal } from '@angular/core';

export type DemoRole = 'claimant' | 'officer';
export const DEMO_ACTORS = [
  { id: 'claimant-1', role: 'claimant', label: 'Claimant 1', initials: 'C1' },
  { id: 'claimant-2', role: 'claimant', label: 'Claimant 2', initials: 'C2' },
  { id: 'officer-1', role: 'officer', label: 'Officer 1', initials: 'O1' },
  { id: 'officer-2', role: 'officer', label: 'Officer 2', initials: 'O2' },
] as const;
const storageKey = 'claimflow.demo-actor';

@Injectable({ providedIn: 'root' })
export class DemoIdentity {
  private readonly actor = signal(this.find(sessionStorage.getItem(storageKey)) ?? DEMO_ACTORS[0]);
  readonly current = this.actor.asReadonly();
  readonly home = computed(() => this.actor().role === 'officer' ? '/officer' : '/claimant');

  select(id: string): void {
    const actor = this.find(id);
    if (!actor) return;
    this.actor.set(actor);
    sessionStorage.setItem(storageKey, actor.id);
  }

  private find(id: string | null) {
    return DEMO_ACTORS.find(actor => actor.id === id);
  }
}
