import { Injectable, signal } from '@angular/core';
import { prefersReducedMotion } from './gsap';

const SEEN_KEY = 'vane.introSeen';

/**
 * Decides whether the opening animation plays, and tells the landing page
 * when it has finished so the hero can animate in as the curtain lifts.
 */
@Injectable({ providedIn: 'root' })
export class IntroState {
  /** Plays once per browser tab, only when arriving on the landing page. */
  readonly shouldPlay = !prefersReducedMotion() && location.pathname === '/' && !alreadySeen();
  readonly done = signal(!this.shouldPlay);

  finish(): void {
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Storage unavailable; the intro will just play again next load.
    }
    this.done.set(true);
  }
}

function alreadySeen(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}
