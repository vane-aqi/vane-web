import { DestroyRef, Directive, ElementRef, effect, inject, input, untracked } from '@angular/core';
import { flipText } from './flip';
import { ScrollTrigger, gsap, prefersReducedMotion } from './gsap';

/**
 * Counts a number up from zero the first time it's shown.
 * Adapted from React Bits' CountUp for Angular.
 *
 *   <span [appCountUp]="reading.display"></span>                 counts when scrolled into view
 *   <span [appCountUp]="reading.display" [countWhen]="ready()">   counts once `ready` turns true
 *
 * The element's text is owned by this directive, so leave it empty in the template.
 */
@Directive({ selector: '[appCountUp]' })
export class CountUp {
  /** The final value as formatted text, e.g. "1,013" or "19.4". */
  readonly appCountUp = input.required<string>();
  readonly countWhen = input<'view' | boolean>('view');

  private readonly el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private played = false;
  /** The text currently settled on screen, so a change can flip from it. */
  private shown: string | null = null;
  private tween?: gsap.core.Tween;
  private trigger?: ScrollTrigger;

  constructor() {
    effect(() => {
      const text = this.appCountUp();
      const when = this.countWhen();
      untracked(() => this.update(text, when));
    });
    inject(DestroyRef).onDestroy(() => {
      this.tween?.kill();
      this.trigger?.kill();
    });
  }

  private update(text: string, when: 'view' | boolean): void {
    // Once counted, later changes such as °F → °C flip like a split-flap board.
    if (this.played || prefersReducedMotion()) {
      const from = this.shown;
      this.played = true;
      this.tween?.kill();
      this.shown = text;
      if (from === null) this.el.textContent = text;
      else flipText(this.el, from, text);
      return;
    }

    this.el.textContent = format(0, decimalsOf(text));
    if (when === true) {
      this.play();
    } else if (when === 'view' && !this.trigger) {
      this.trigger = ScrollTrigger.create({
        trigger: this.el,
        start: 'top 92%',
        once: true,
        onEnter: () => this.play(),
      });
    }
  }

  private play(): void {
    if (this.played) return;
    this.played = true;
    const text = this.appCountUp();
    const decimals = decimalsOf(text);
    const counter = { v: 0 };
    this.tween = gsap.to(counter, {
      v: parseFloat(text.replace(/,/g, '')) || 0,
      duration: 1.4,
      ease: 'power3.out',
      onUpdate: () => (this.el.textContent = format(counter.v, decimals)),
      onComplete: () => {
        this.shown = this.appCountUp();
        this.el.textContent = this.shown;
      },
    });
  }
}

function decimalsOf(text: string): number {
  return text.includes('.') ? text.split('.')[1].length : 0;
}

function format(value: number, decimals: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
