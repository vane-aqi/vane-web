import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Segment } from '../core/models';
import { gsap, prefersReducedMotion } from '../motion/gsap';

const RADIUS = 80;
const CENTER = { x: 100, y: 100 };
const GAP = 0.8;

/**
 * A half-circle gauge. Each zone is the same arc path drawn with a different
 * dash offset, which is why `pathLength="100"` matters: it lets us use percentages.
 * The needle springs to its value like a real instrument, and swings again
 * whenever the value changes. Whatever you put between the tags shows under the dial.
 */
@Component({
  selector: 'app-arc-gauge',
  template: `
    <svg viewBox="0 0 200 112" role="img" [attr.aria-label]="label()">
      @for (seg of arcs(); track seg.offset) {
        <path
          [attr.d]="path"
          pathLength="100"
          class="arc"
          [attr.data-tone]="seg.tone"
          [attr.data-swatch]="seg.swatch"
          [attr.stroke-dasharray]="seg.dash"
          [attr.stroke-dashoffset]="seg.offset"
        />
      }
      <line class="needle" x1="100" y1="100" [attr.x2]="needle().x" [attr.y2]="needle().y" />
      <circle class="hub" cx="100" cy="100" r="3" />
    </svg>
    <div class="center"><ng-content /></div>
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      width: 100%;
      max-width: 420px;
    }
    svg {
      display: block;
      width: 100%;
      overflow: visible;
    }
    .arc {
      fill: none;
      stroke: var(--tone-fill);
      stroke-width: 6;
    }
    .arc[data-swatch='cold'] {
      stroke: var(--cold-fill);
    }
    .arc[data-swatch='comfort'] {
      stroke: var(--comfort-fill);
    }
    .arc[data-swatch='hot'] {
      stroke: var(--hot-fill);
    }
    .needle {
      stroke: var(--ink);
      stroke-width: 1.5;
      stroke-linecap: round;
    }
    .hub {
      fill: var(--ink);
    }
    .center {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 16px;
      text-align: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArcGauge {
  readonly segments = input.required<Segment[]>();
  readonly markerPct = input.required<number>();
  readonly label = input('');

  protected readonly path = `M ${CENTER.x - RADIUS} ${CENTER.y} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER.x + RADIUS} ${CENTER.y}`;

  /** Where the needle is drawn right now; animates toward markerPct. */
  private readonly shownPct = signal(0);

  protected readonly arcs = computed(() =>
    this.segments().map((s) => ({
      tone: s.tone,
      swatch: s.swatch,
      dash: `${Math.max(0, s.widthPct - GAP)} 100`,
      offset: -s.startPct,
    })),
  );

  /** The needle reaches a little past the arc so it reads like an instrument. */
  protected readonly needle = computed(() => {
    const angle = Math.PI * (1 - this.shownPct() / 100);
    const length = RADIUS + 10;
    return { x: CENTER.x + length * Math.cos(angle), y: CENTER.y - length * Math.sin(angle) };
  });

  constructor() {
    let tween: gsap.core.Tween | undefined;
    effect(() => {
      const target = this.markerPct();
      untracked(() => {
        tween?.kill();
        if (prefersReducedMotion()) {
          this.shownPct.set(target);
          return;
        }
        const proxy = { v: this.shownPct() };
        tween = gsap.to(proxy, {
          v: target,
          duration: 1.6,
          ease: 'elastic.out(1, 0.5)',
          onUpdate: () => this.shownPct.set(proxy.v),
        });
      });
    });
    inject(DestroyRef).onDestroy(() => tween?.kill());
  }
}
