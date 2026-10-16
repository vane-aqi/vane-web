import { DestroyRef, Directive, ElementRef, effect, inject, input, untracked } from '@angular/core';
import { gsap, prefersReducedMotion } from './gsap';

const running = new WeakMap<HTMLElement, gsap.core.Timeline>();

/**
 * Split-flap ("flip clock") change: every character that differs flips over.
 * The top half of the old character falls away, then the bottom half of the
 * new one lands. Unchanged characters stay put. Strings are right-aligned,
 * so "67" → "19.4" lines its digits up like a real board.
 *
 * The element's text is rebuilt during the flip and restored to plain text
 * afterwards. Styles for the pieces live in styles.css (.flip-*).
 */
export function flipText(el: HTMLElement, from: string, to: string): void {
  running.get(el)?.kill();
  running.delete(el);

  if (from === to || prefersReducedMotion()) {
    el.textContent = to;
    return;
  }

  const n = Math.max(from.length, to.length);
  const a = from.padStart(n, ' ');
  const b = to.padStart(n, ' ');
  const make = (cls: string, text: string) => {
    const s = document.createElement('span');
    s.className = cls;
    s.textContent = text;
    return s;
  };

  el.textContent = '';
  // Screen readers get the final value once; the flapping pieces are hidden from them.
  el.append(make('visually-hidden', to));

  const flaps: { top: HTMLElement; bottom: HTMLElement }[] = [];
  for (let i = 0; i < n; i++) {
    // Unchanged characters stay plain text (so spaces keep their width).
    if (a[i] === b[i]) {
      const plain = make('', a[i]);
      plain.setAttribute('aria-hidden', 'true');
      el.append(plain);
      continue;
    }

    const oldC = a[i] === ' ' ? '' : a[i];
    const newC = b[i] === ' ' ? '' : b[i];
    const cell = make('flip-cell', '');
    cell.setAttribute('aria-hidden', 'true');

    // Sizes the cell to the wider of the two characters.
    cell.append(make('flip-size', newC.length ? newC : oldC));
    cell.append(make('flip-half flip-top', newC));
    cell.append(make('flip-half flip-bottom', oldC));
    const top = make('flip-flap flip-top', oldC);
    const bottom = make('flip-flap flip-bottom', newC);
    cell.append(top, bottom);
    el.append(cell);
    flaps.push({ top, bottom });
  }

  const tl = gsap.timeline({
    onComplete: () => {
      el.textContent = to;
      running.delete(el);
    },
  });
  flaps.forEach(({ top, bottom }, i) => {
    const at = i * 0.06;
    tl.fromTo(top, { rotationX: 0 }, { rotationX: -90, duration: 0.2, ease: 'power1.in' }, at).fromTo(
      bottom,
      { rotationX: 90 },
      { rotationX: 0, duration: 0.28, ease: 'back.out(2)' },
      at + 0.2,
    );
  });
  running.set(el, tl);
}

/**
 * Shows text and flips it, split-flap style, whenever it changes.
 *
 *   <span class="num" [appFlip]="reading.display"></span>
 *
 * The directive owns the element's text, so leave it empty in the template.
 */
@Directive({ selector: '[appFlip]' })
export class Flip {
  readonly appFlip = input.required<string>();

  constructor() {
    const el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    let current: string | null = null;

    effect(() => {
      const next = this.appFlip();
      untracked(() => {
        if (current === null) el.textContent = next;
        else flipText(el, current, next);
        current = next;
      });
    });

    inject(DestroyRef).onDestroy(() => running.get(el)?.kill());
  }
}
