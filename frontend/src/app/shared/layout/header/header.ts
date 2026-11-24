import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DEMO_ACTORS, DemoIdentity } from '../../../core/identity/demo-identity';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly identity = inject(DemoIdentity);
  protected readonly actors = DEMO_ACTORS;
  private readonly router = inject(Router);

  protected changeIdentity(id: string): void {
    const previousRole = this.identity.current().role;
    this.identity.select(id);
    if (previousRole !== this.identity.current().role) {
      void this.router.navigateByUrl(this.identity.home());
    }
  }
}
