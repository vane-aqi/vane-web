import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import Lenis from 'lenis';
import { filter } from 'rxjs';
import { ScrollTrigger, gsap, prefersReducedMotion } from './gsap';

/**
 * Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger animations
 * stay in sync with the eased scroll position.
 */
@Injectable({ providedIn: 'root' })
export class SmoothScroll {
  private readonly router = inject(Router);
  private lenis: Lenis | null = null;
  private started = false;

  init(): void {
    if (this.started) return;
    this.started = true;

    // Each new page starts at the top.
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.toTop());

    if (prefersReducedMotion()) return;
    this.lenis = new Lenis({ autoRaf: false, lerp: 0.1 });
    this.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => this.lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  scrollTo(target: HTMLElement): void {
    if (this.lenis) this.lenis.scrollTo(target, { offset: -24, duration: 1.4 });
    else target.scrollIntoView();
  }

  stop(): void {
    this.lenis?.stop();
  }

  start(): void {
    this.lenis?.start();
  }

  private toTop(): void {
    if (this.lenis) this.lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }
}
