import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';
import { gsap, prefersReducedMotion, splitLines } from './gsap';

export type RevealMode = '' | 'up' | 'lines' | 'rule' | 'fade';

/**
 * The shared entrance used on every page, so the whole site moves the same way.
 *
 *   <p appReveal>                     rises and fades in
 *   <h1 appReveal="lines">            each line slides up out of a mask (static text only:
 *                                     splitting replaces the text, so bound text stops updating)
 *   <div class="ruled" appReveal="rule">   its top rule draws in from the left
 *   <p appReveal="fade">              fades only
 *
 * Each plays once, when the element scrolls into view. Add [revealDelay]="0.1"
 * to stagger siblings. Elements start hidden (see `html.motion [data-reveal]`
 * in styles.css) so nothing flashes before its animation.
 */
@Directive({
  selector: '[appReveal]',
  host: { '[attr.data-reveal]': "appReveal() || 'up'" },
})
export class Reveal {
  readonly appReveal = input<RevealMode>('');
  readonly revealDelay = input(0);

  constructor() {
    const el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    let ctx: gsap.Context | undefined;
    let destroyed = false;

    afterNextRender(async () => {
      if (prefersReducedMotion()) return;
      const mode = this.appReveal() || 'up';
      const delay = this.revealDelay();

      // Line splitting needs the final fonts, or the line breaks come out wrong.
      if (mode === 'lines') await document.fonts?.ready;
      if (destroyed) return;

      ctx = gsap.context(() => {
        // Fire as soon as the element's top edge enters the screen. A later start
        // could leave items near the bottom of a short page hidden forever.
        const scrollTrigger = { trigger: el, start: 'top bottom', once: true };
        switch (mode) {
          case 'lines': {
            const split = splitLines(el);
            gsap.set(el, { visibility: 'visible' });
            gsap.from(split.lines, {
              yPercent: 108,
              duration: 1.1,
              ease: 'power4.out',
              stagger: 0.08,
              delay,
              scrollTrigger,
              onComplete: () => split.revert(),
            });
            break;
          }
          case 'rule':
            gsap.from(el, { '--rule': 0, duration: 1.2, ease: 'power3.inOut', delay, scrollTrigger });
            break;
          case 'fade':
            gsap.from(el, { autoAlpha: 0, duration: 0.9, ease: 'power2.out', delay, scrollTrigger });
            break;
          default:
            gsap.from(el, { autoAlpha: 0, y: 26, duration: 0.95, ease: 'power3.out', delay, scrollTrigger });
        }
      }, el);
    });

    inject(DestroyRef).onDestroy(() => {
      destroyed = true;
      ctx?.revert();
    });
  }
}
