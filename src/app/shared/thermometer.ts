import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Segment } from '../core/models';
import { gsap, prefersReducedMotion } from '../motion/gsap';

/** The scale runs from y=316 (0%) up to y=26 (100%). The drawing has room on the left for labels. */
const BOTTOM = 316;
const TOP = 26;
const yAt = (pct: number) => BOTTOM - (pct / 100) * (BOTTOM - TOP);

/**
 * A thermometer for the temperature reading. The liquid rises from the bulb to
 * the value, colored by the zone it lands in (cold, comfort or hot). A thin
 * stripe beside the tube shows the zones, with labeled ticks at their edges.
 * Whatever you put between the tags shows beside the tube.
 */
@Component({
  selector: 'app-thermometer',
  template: `
    <svg viewBox="-46 0 166 400" role="img" [attr.aria-label]="label()">
      <!-- ticks every 10% on the left, longer at zone edges -->
      @for (t of ticks; track t.y) {
        <line class="tick" x1="32" [attr.y1]="t.y" x2="40" [attr.y2]="t.y" />
      }
      @for (b of edges(); track b.y) {
        <line class="edge" x1="24" [attr.y1]="b.y" x2="40" [attr.y2]="b.y" />
        @if (!compact()) {
          <text x="20" [attr.y]="b.y + 4.5">{{ b.label }}</text>
        }
      }
      @if (!compact()) {
        <text class="end" x="20" [attr.y]="bottom + 4.5">{{ scaleMin() }}</text>
        <text class="end" x="20" [attr.y]="top + 4.5">{{ scaleMax() }}</text>
      }

      <!-- zone stripe on the right -->
      @for (z of zones(); track z.y) {
        <rect class="zone" [attr.data-swatch]="z.swatch" [attr.data-tone]="z.tone" x="76" [attr.y]="z.y" width="4" [attr.height]="z.h" />
      }

      <!-- liquid: column plus bulb, in the color of the current zone -->
      <g class="liquid" [attr.data-swatch]="current().swatch" [attr.data-tone]="current().tone">
        <rect x="51" [attr.y]="levelY()" width="10" [attr.height]="348 - levelY()" rx="5" />
        <circle cx="56" cy="350" r="18" />
      </g>

      <!-- glass outline: tube and bulb as one shape -->
      <path class="glass" d="M 44 327 V 24 A 12 12 0 0 1 68 24 V 327 A 26 26 0 1 1 44 327 Z" />
    </svg>
    <div class="reading"><ng-content /></div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: clamp(8px, 2vw, 28px);
    }
    svg {
      display: block;
      height: min(42vh, 360px);
      width: auto;
      aspect-ratio: 166 / 400;
      overflow: visible;
      flex: none;
    }
    :host(.compact) svg {
      height: 160px;
    }
    .glass {
      fill: none;
      stroke: var(--ink);
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
    }
    .tick {
      stroke: var(--line-strong);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
    }
    .edge {
      stroke: var(--ink);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
    }
    text {
      font-family: var(--font-mono);
      font-size: 13px;
      fill: var(--ink);
      text-anchor: end;
    }
    text.end {
      fill: var(--muted);
    }
    .zone,
    .liquid {
      fill: var(--tone-fill);
    }
    [data-swatch='cold'] {
      fill: var(--cold-fill);
    }
    [data-swatch='comfort'] {
      fill: var(--comfort-fill);
    }
    [data-swatch='hot'] {
      fill: var(--hot-fill);
    }
    /* The liquid is a shade deeper than the stripe so it stands out in the glass. */
    .liquid[data-swatch='comfort'] {
      fill: color-mix(in srgb, var(--comfort-fill) 78%, var(--ink));
    }
    .liquid {
      transition: fill 0.4s ease;
    }
    .reading {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
  `,
  host: { '[class.compact]': 'compact()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Thermometer {
  readonly segments = input.required<Segment[]>();
  readonly markerPct = input.required<number>();
  readonly bounds = input<{ pct: number; label: string }[]>([]);
  readonly scaleMin = input('');
  readonly scaleMax = input('');
  readonly label = input('');
  /** Small version for phones: no text labels on the scale. */
  readonly compact = input(false);

  protected readonly bottom = BOTTOM;
  protected readonly top = TOP;
  protected readonly ticks = Array.from({ length: 11 }, (_, i) => ({ y: yAt(i * 10) }));

  /** Where the liquid's top is drawn right now; animates toward markerPct. */
  private readonly shownPct = signal(0);
  protected readonly levelY = computed(() => yAt(this.shownPct()));

  protected readonly edges = computed(() => this.bounds().map((b) => ({ y: yAt(b.pct), label: b.label })));

  protected readonly zones = computed(() =>
    this.segments().map((s) => {
      const y = yAt(s.startPct + s.widthPct);
      return { y: y + 1, h: Math.max(0, yAt(s.startPct) - y - 2), swatch: s.swatch, tone: s.tone };
    }),
  );

  /** The zone the reading falls in; its color fills the liquid. */
  protected readonly current = computed(() => {
    const pct = this.markerPct();
    const segs = this.segments();
    return segs.find((s) => pct >= s.startPct && pct < s.startPct + s.widthPct) ?? segs[segs.length - 1];
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
          duration: 1.8,
          ease: 'back.out(1.2)',
          onUpdate: () => this.shownPct.set(proxy.v),
        });
      });
    });
    inject(DestroyRef).onDestroy(() => tween?.kill());
  }
}
