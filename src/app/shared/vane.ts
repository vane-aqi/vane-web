import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { gsap, prefersReducedMotion } from '../motion/gsap';

/** The compass ring, seen from slightly above: an ellipse around the pole. */
const RING = { cx: 120, cy: 196, rx: 88, ry: 24 };

/** Tick marks every 15°, longer at the cardinal points. */
const TICKS = Array.from({ length: 24 }, (_, i) => {
  const a = (i * 15 * Math.PI) / 180;
  const inner = i % 6 === 0 ? 0.84 : 0.92;
  return {
    x1: RING.cx + RING.rx * Math.cos(a),
    y1: RING.cy - RING.ry * Math.sin(a),
    x2: RING.cx + RING.rx * inner * Math.cos(a),
    y2: RING.cy - RING.ry * inner * Math.sin(a),
  };
});

/**
 * A line-drawn weather vane. It draws itself in, then the arrow keeps turning
 * in 3D as if catching drafts, while a dot on the compass ring tracks where it
 * points. The arrowhead and dot are drawn in the vane's blue.
 * Size it by setting a width on the element; it's 4:3 tall.
 */
@Component({
  selector: 'app-vane',
  template: `
    <div class="frame" aria-hidden="true">
      <svg class="mast" viewBox="0 0 240 320">
        <!-- roof ridge and mount -->
        <path class="draw faint" d="M 36 314 L 120 292 L 204 314" pathLength="1" />
        <line class="draw" x1="108" y1="292" x2="132" y2="292" pathLength="1" />

        <!-- compass ring: back half, pole, then front half so the pole passes through it -->
        <path class="draw faint" [attr.d]="ringBack" pathLength="1" />
        <line class="draw" x1="120" y1="46" x2="120" y2="292" pathLength="1" />
        <path class="draw faint" [attr.d]="ringFront" pathLength="1" />
        @for (t of ticks; track $index) {
          <line class="tick" [attr.x1]="t.x1" [attr.y1]="t.y1" [attr.x2]="t.x2" [attr.y2]="t.y2" />
        }
        <text class="side" x="128" y="166">N</text>
        <text class="side" x="128" y="236">S</text>
        <text x="220" y="200">E</text>
        <text x="20" y="200">W</text>
        <circle #heading class="heading" [attr.cx]="ring.cx + ring.rx" [attr.cy]="ring.cy" r="4" />

        <!-- ornament ball and finial -->
        <circle class="draw" cx="120" cy="124" r="8" pathLength="1" />
        <circle class="solid" cx="120" cy="42" r="3.5" />
      </svg>

      <div class="arrow-wrap">
        <div class="arrow" #arrow>
          <svg viewBox="0 0 240 60">
            <line class="draw" x1="52" y1="30" x2="200" y2="30" pathLength="1" />
            <!-- barbed head -->
            <path class="head" d="M 226 30 L 194 18 L 202 30 L 194 42 Z" />
            <!-- tail sail with fletching -->
            <path class="draw" d="M 14 12 H 44 L 58 30 L 44 48 H 14 L 26 30 Z" pathLength="1" />
            <path class="draw faint" d="M 30 12 L 42 30 L 30 48" pathLength="1" />
            <!-- pivot -->
            <circle class="draw" cx="120" cy="30" r="7" pathLength="1" />
            <circle class="solid" cx="120" cy="30" r="3" />
          </svg>
        </div>
      </div>
    </div>
    @if (caption()) {
      <p class="caption mono">{{ caption() }}</p>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .frame {
      position: relative;
      width: 100%;
      aspect-ratio: 3 / 4;
    }
    svg {
      display: block;
      overflow: visible;
    }
    .mast {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .arrow-wrap {
      position: absolute;
      inset: 12.5% 0 auto;
      height: 18.75%;
      perspective: 800px;
    }
    .arrow {
      width: 100%;
      height: 100%;
      transform-style: preserve-3d;
      transform: rotateY(-35deg);
    }
    .arrow svg {
      width: 100%;
      height: 100%;
    }
    .draw,
    .tick {
      fill: none;
      stroke: var(--ink);
      stroke-width: 1.4;
      stroke-linecap: round;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
    }
    .faint,
    .tick {
      stroke: var(--line-strong);
    }
    .tick {
      stroke-width: 1;
    }
    .head,
    .heading {
      fill: var(--vane-blue);
    }
    .solid {
      fill: var(--ink);
    }
    text {
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 0.06em;
      fill: var(--muted);
      text-anchor: middle;
    }
    text.side {
      text-anchor: start;
    }
    .caption {
      margin: 0;
      color: var(--muted);
      text-align: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Vane {
  readonly caption = input('');
  /** Set false to hold the drawing until something else (like the hero) is ready. */
  readonly play = input(true);

  protected readonly ring = RING;
  protected readonly ticks = TICKS;
  protected readonly ringBack = `M ${RING.cx - RING.rx} ${RING.cy} A ${RING.rx} ${RING.ry} 0 0 1 ${RING.cx + RING.rx} ${RING.cy}`;
  protected readonly ringFront = `M ${RING.cx + RING.rx} ${RING.cy} A ${RING.rx} ${RING.ry} 0 0 1 ${RING.cx - RING.rx} ${RING.cy}`;

  private readonly arrow = viewChild.required<ElementRef<HTMLElement>>('arrow');
  private readonly heading = viewChild.required<ElementRef<SVGCircleElement>>('heading');

  constructor() {
    const host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    const rendered = signal(false);
    let ctx: gsap.Context | undefined;
    let started = false;

    afterNextRender(() => {
      this.placeHeading(-35);
      rendered.set(true);
    });

    effect(() => {
      if (!rendered() || !this.play() || started) return;
      started = true;
      untracked(() => {
        if (prefersReducedMotion()) return;
        const arrow = this.arrow().nativeElement;
        const follow = () => this.placeHeading(Number(gsap.getProperty(arrow, 'rotationY')));

        // Each swing picks a new heading, like a gust changing direction.
        const swing = () =>
          gsap.to(arrow, {
            rotationY: gsap.utils.random(-150, 150),
            duration: gsap.utils.random(2.8, 4.8),
            delay: gsap.utils.random(0.4, 1.8),
            ease: 'sine.inOut',
            onUpdate: follow,
            onComplete: swing,
          });

        ctx = gsap.context(() => {
          gsap.fromTo(
            '.draw',
            { strokeDasharray: 1, strokeDashoffset: 1 },
            {
              strokeDashoffset: 0,
              duration: 1.4,
              ease: 'power2.inOut',
              stagger: 0.07,
              // Chrome measures dashes slightly short on non-scaling strokes, which can
              // leave circles open. Once drawn, drop the dash so every line is whole.
              onComplete: () => gsap.set('.draw', { strokeDasharray: 'none' }),
            },
          );
          gsap.from('.tick', { autoAlpha: 0, duration: 0.4, stagger: 0.02, delay: 0.6 });
          gsap.from('text, .solid, .head, .heading, .caption', { autoAlpha: 0, duration: 0.6, stagger: 0.05, delay: 1 });
          gsap.fromTo(
            arrow,
            { rotationY: 90 },
            { rotationY: -35, duration: 2, ease: 'elastic.out(1, 0.4)', delay: 0.8, onUpdate: follow, onComplete: swing },
          );
        }, host);
      });
    });

    inject(DestroyRef).onDestroy(() => {
      ctx?.revert();
      gsap.killTweensOf(this.arrow().nativeElement);
    });
  }

  /**
   * Put the ring dot where the arrow points. rotateY(θ) turns the head away
   * from the viewer for positive θ, which is "north" (the far side of the ring).
   */
  private placeHeading(degrees: number): void {
    const a = (degrees * Math.PI) / 180;
    const dot = this.heading().nativeElement;
    dot.setAttribute('cx', String(RING.cx + RING.rx * Math.cos(a)));
    dot.setAttribute('cy', String(RING.cy - RING.ry * Math.sin(a)));
  }
}
