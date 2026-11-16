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
    @if (!onLanding()) {
      <div class="page-glow" [attr.data-page]="section()" aria-hidden="true"></div>
    }
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
    /* Soft brand light (sky, sage, a touch of gold) fixed behind the content of
       every page except the landing page. Each section arranges it differently. */
    .page-glow {
      --sky: color-mix(in srgb, var(--good-fill) 40%, transparent);
      --sage: color-mix(in srgb, var(--comfort-fill) 45%, transparent);
      --gold: color-mix(in srgb, var(--watch-fill) 26%, transparent);
      position: fixed;
      inset: 0;
      z-index: -1;
      pointer-events: none;
      filter: blur(40px);
      opacity: 0.5;
      background:
        radial-gradient(34% 40% at 18% 34%, var(--sky), transparent 70%),
        radial-gradient(32% 40% at 84% 70%, var(--sage), transparent 70%),
        radial-gradient(22% 26% at 72% 12%, var(--gold), transparent 70%);
    }
    /* Dashboard: sky over the room tiles, sage under What to do. (The default above.) */
    /* Reading pages: light pooled behind the gauge, sage low on the right. */
    .page-glow[data-page='readings'] {
      background:
        radial-gradient(30% 42% at 26% 52%, var(--sky), transparent 70%),
        radial-gradient(34% 36% at 78% 86%, var(--sage), transparent 70%);
    }
    /* Monitors: sage leading from the top left, sky toward the add-a-monitor tile. */
    .page-glow[data-page='monitors'] {
      background:
        radial-gradient(36% 40% at 14% 22%, var(--sage), transparent 70%),
        radial-gradient(32% 38% at 80% 82%, var(--sky), transparent 70%),
        radial-gradient(18% 22% at 52% 46%, var(--gold), transparent 70%);
    }
    /* Shop: a warm key light behind the product, cool fill on the far side. */
    .page-glow[data-page='shop'] {
      background:
        radial-gradient(30% 36% at 30% 44%, var(--gold), transparent 70%),
        radial-gradient(32% 40% at 22% 70%, var(--sky), transparent 70%),
        radial-gradient(30% 38% at 86% 30%, var(--sage), transparent 70%);
    }
    /* About: sage behind the introduction, sky by the vane. */
    .page-glow[data-page='about'] {
      background:
        radial-gradient(36% 38% at 24% 40%, var(--sage), transparent 70%),
        radial-gradient(26% 34% at 82% 26%, var(--sky), transparent 70%);
    }
    /* Contact: sky low on the left, gold and sage behind the form. */
    .page-glow[data-page='contact'] {
      background:
        radial-gradient(32% 38% at 16% 78%, var(--sky), transparent 70%),
        radial-gradient(24% 28% at 82% 16%, var(--gold), transparent 70%),
        radial-gradient(30% 40% at 74% 62%, var(--sage), transparent 70%);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);

  protected readonly onLanding = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects === '/' || e.urlAfterRedirects.startsWith('/#')),
    ),
    { initialValue: location.pathname === '/' },
  );

  /** The first part of the URL ("dashboard", "shop"...), which picks the page's glow. */
  protected readonly section = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects.split(/[/?#]/)[1] ?? ''),
    ),
    { initialValue: location.pathname.split('/')[1] ?? '' },
  );

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
