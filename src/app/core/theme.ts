import { Injectable, signal } from '@angular/core';
import { prefersReducedMotion } from '../motion/gsap';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'vane.theme';
const THEME_COLORS: Record<ThemeMode, string> = { light: '#f1f2ee', dark: '#0e1311' };

/**
 * Light/dark theme. The first paint is handled by a small script in index.html
 * (so there's no flash); this service takes over from there.
 */
@Injectable({ providedIn: 'root' })
export class Theme {
  readonly mode = signal<ThemeMode>(document.documentElement.dataset['theme'] === 'dark' ? 'dark' : 'light');

  /**
   * Switch themes. When given the click position, the new theme spreads out from
   * that point as a circle (View Transitions API, where supported).
   */
  toggle(origin?: { x: number; y: number }): void {
    const next: ThemeMode = this.mode() === 'dark' ? 'light' : 'dark';
    const apply = () => {
      this.mode.set(next);
      document.documentElement.dataset['theme'] = next;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[next]);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Storage unavailable; the choice lasts for this visit only.
      }
    };

    const doc = document as Document & {
      startViewTransition?: (update: () => void) => { ready: Promise<void> };
    };
    if (!origin || !doc.startViewTransition || prefersReducedMotion()) {
      apply();
      return;
    }

    const { x, y } = origin;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    doc.startViewTransition(apply).ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 700, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    });
  }
}
