import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
} from '@angular/core';
import { gsap, prefersReducedMotion } from './gsap';

/**
 * A paragraph whose words brighten one by one as it scrolls through the viewport.
 * Adapted from React Bits' ScrollReveal for Angular.
 */
@Component({
  selector: 'app-scroll-words',
  template: `
    <p>
      @for (word of words(); track $index) {
        <span class="w">{{ word + ' ' }}</span>
      }
    </p>
  `,
  styles: `
    :host {
      display: block;
    }
    p {
      margin: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollWords {
  readonly text = input.required<string>();
  protected readonly words = computed(() => this.text().split(/\s+/).filter(Boolean));

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;

  constructor() {
    let ctx: gsap.Context | undefined;
    afterNextRender(() => {
      if (prefersReducedMotion()) return;
      ctx = gsap.context(() => {
        gsap.fromTo(
          '.w',
          { opacity: 0.14 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.05,
            scrollTrigger: { trigger: this.host, start: 'top 80%', end: 'bottom 45%', scrub: true },
          },
        );
      }, this.host);
    });
    inject(DestroyRef).onDestroy(() => ctx?.revert());
  }
}
