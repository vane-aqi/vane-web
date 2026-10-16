import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

// Plugins must be registered once before use. Import gsap from this file, not from 'gsap'.
gsap.registerPlugin(ScrollTrigger, SplitText);

export { gsap, ScrollTrigger, SplitText };

/**
 * Split an element into lines, each inside a clipping mask, ready to slide up.
 * Tight headline line-heights make the masks shorter than the letters, which
 * would slice off descenders (the tails of y, g, p). So each mask gets extra
 * room below, cancelled with a negative margin so the layout doesn't move.
 * Call `revert()` on the result once the animation ends to restore plain text.
 */
export function splitLines(target: string | Element): SplitText {
  const split = SplitText.create(target, { type: 'lines', mask: 'lines' });
  gsap.set(split.masks, { paddingBottom: '0.18em', marginBottom: '-0.18em' });
  return split;
}

/** True when the visitor asked for less motion, or when there's no browser (tests). */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia !== 'function' || matchMedia('(prefers-reduced-motion: reduce)').matches;
}
