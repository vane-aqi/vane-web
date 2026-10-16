import { ChangeDetectionStrategy, Component, afterNextRender, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { SiteFooter } from './layout/site-footer';
import { SiteHeader } from './layout/site-header';
import { Intro } from './motion/intro';
import { SmoothScroll } from './motion/smooth-scroll';

/** The shell every page renders inside. The router swaps pages into <router-outlet>. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeader, SiteFooter, Intro],
  template: `
    <app-intro />
    <app-site-header />
    <main>
      <router-outlet />
    </main>
    <!-- Reading pages are designed to fit one screen, so they skip the footer. -->
    @if (!onReadingPage()) {
      <app-site-footer />
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    main {
      flex: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);

  protected readonly onReadingPage = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects.startsWith('/readings/')),
    ),
    { initialValue: false },
  );

  constructor() {
    const smooth = inject(SmoothScroll);
    afterNextRender(() => smooth.init());
  }
}
