import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { byUrgency } from '../../core/evaluate';
import { ReadingsStore } from '../../core/readings-store';
import { CountUp } from '../../motion/count-up';
import { ScrollTrigger, gsap, prefersReducedMotion, splitLines } from '../../motion/gsap';
import { IntroState } from '../../motion/intro-state';
import { Reveal } from '../../motion/reveal';
import { ScrollWords } from '../../motion/scroll-words';
import { SmoothScroll } from '../../motion/smooth-scroll';
import { Icon } from '../../shared/icon';
import { RangeScale } from '../../shared/range-scale';
import { Vane } from '../../shared/vane';

/** Gentle curves behind the hero, drawn across a 1440×800 box. Suggests air moving through a room. */
const AIR_PATHS = Array.from({ length: 9 }, (_, i) => {
  const y = 90 + i * 80;
  const lift = 30 + (i % 3) * 14;
  return `M -40 ${y} C 300 ${y - lift}, 560 ${y + lift}, 880 ${y} S 1300 ${y - lift}, 1480 ${y}`;
});

@Component({
  selector: 'app-landing',
  imports: [RouterLink, CountUp, Icon, RangeScale, Reveal, ScrollWords, Vane],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  protected readonly store = inject(ReadingsStore);
  private readonly intro = inject(IntroState);
  private readonly smooth = inject(SmoothScroll);
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly measures = viewChild.required<ElementRef<HTMLElement>>('measures');

  /** The room the hero and the walkthrough describe. */
  protected readonly home = this.store.primary;
  protected readonly airPaths = AIR_PATHS;
  /** Flips true once the hero has animated in; starts the counters and the vane. */
  protected readonly heroReady = signal(false);

  protected readonly vaneCaption = computed(() => {
    const m = this.home();
    return `${m.name} · ${m.overall?.label ?? 'Offline'}`;
  });

  /** The most urgent advice, written out as one plain statement. */
  protected readonly statement = computed(() => {
    const top = this.home().actions[0];
    if (!top) return 'Every reading is in the healthy range right now, and Vane will say so plainly.';
    const subject = top.gases.length ? [...top.gases].sort(byUrgency)[0] : null;
    const name = subject ? subject.def.name : top.def.label;
    const value = subject ? `${subject.display} ${subject.unit}` : `${top.display} ${top.unit}`;
    return `${name} is at ${value}. ${top.advice}`;
  });

  private readonly viewReady = signal(false);
  private ctx?: gsap.Context;
  private heroPlayed = false;

  constructor() {
    afterNextRender(() => {
      this.ctx = gsap.context(() => this.setupScrollScenes(), this.host);
      this.viewReady.set(true);
    });

    // Hero animates in as soon as the page is rendered and the intro (if any) is lifting.
    effect(() => {
      if (this.viewReady() && this.intro.done()) untracked(() => this.playHero());
    });

    inject(DestroyRef).onDestroy(() => this.ctx?.revert());
  }

  protected jumpToMeasures(event: Event): void {
    event.preventDefault();
    this.smooth.scrollTo(this.measures().nativeElement);
  }

  private async playHero(): Promise<void> {
    if (this.heroPlayed) return;
    this.heroPlayed = true;

    if (prefersReducedMotion() || !this.ctx) {
      this.heroReady.set(true);
      return;
    }

    // Split lines only after the web fonts load, or the line breaks will be wrong.
    await document.fonts?.ready;

    this.ctx.add(() => {
      const split = splitLines('.headline');
      gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        .set('.hero-copy', { visibility: 'visible' })
        .from(split.lines, { yPercent: 105, duration: 1.2, stagger: 0.09, onComplete: () => split.revert() })
        .from('.kicker, .lede, .ctas', { autoAlpha: 0, y: 18, duration: 0.9, stagger: 0.08 }, 0.25)
        .from('.readout-grid', { '--rule': 0, duration: 1.2, ease: 'power3.inOut' }, 0.3)
        .from('.readout-label, .readout-item', { autoAlpha: 0, y: 14, duration: 0.7, stagger: 0.06 }, 0.45)
        .add(() => this.heroReady.set(true), 0.5);
    });
    ScrollTrigger.refresh();
  }

  private setupScrollScenes(): void {
    if (prefersReducedMotion()) return;

    // Air lines drift slowly and forever.
    gsap.utils.toArray<SVGPathElement>('.air path').forEach((path, i) => {
      gsap.fromTo(
        path,
        { strokeDashoffset: (i * 137) % 1000 },
        { strokeDashoffset: `-=${1000}`, duration: 16 + (i % 4) * 5, ease: 'none', repeat: -1 },
      );
    });

    // Each measurement row slides in and its needle sweeps to the value.
    gsap.utils.toArray<HTMLElement>('.measure').forEach((row) => {
      const trigger = { trigger: row, start: 'top 85%' };
      gsap.from(row, { autoAlpha: 0, y: 48, duration: 1, ease: 'power3.out', scrollTrigger: trigger });
      const marker = row.querySelector('.marker');
      if (marker) {
        gsap.from(marker, { left: '0%', duration: 1.4, ease: 'power3.inOut', delay: 0.2, scrollTrigger: trigger });
      }
    });

    gsap.from('.band span', {
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 1,
      ease: 'power3.inOut',
      stagger: 0.18,
      scrollTrigger: { trigger: '.states', start: 'top 70%' },
    });
  }
}
