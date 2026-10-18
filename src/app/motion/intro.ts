import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ReadingsStore } from '../core/readings-store';
import { gsap } from './gsap';
import { IntroState } from './intro-state';
import { SmoothScroll } from './smooth-scroll';

/**
 * The opening sequence: the instrument "calibrates" (readouts count up, the
 * needle line sweeps), the wordmark rises, then the panel lifts off the page.
 */
@Component({
  selector: 'app-intro',
  template: `
    @if (visible()) {
      <div class="intro" #root>
        <p class="top mono">Indoor air monitor</p>

        <div class="center">
          <p class="word" aria-label="Vane">
            @for (ch of letters; track $index) {
              <span class="mask" aria-hidden="true"><span class="ch">{{ ch }}</span></span>
            }
          </p>
          <span class="sweep"></span>
        </div>

        <div class="bottom">
          <dl class="readouts">
            @for (r of readouts(); track r.label) {
              <div>
                <dt class="mono">{{ r.label }}</dt>
                <dd><span class="v" [attr.data-to]="r.value">0</span> <span class="mono keep-case">{{ r.unit }}</span></dd>
              </div>
            }
          </dl>
          <button type="button" class="skip mono" (click)="skip()">Skip intro</button>
        </div>
      </div>
    }
  `,
  styleUrl: './intro.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Intro {
  private readonly state = inject(IntroState);
  private readonly smooth = inject(SmoothScroll);
  private readonly store = inject(ReadingsStore);
  private readonly root = viewChild<ElementRef<HTMLElement>>('root');

  protected readonly visible = signal(this.state.shouldPlay);
  protected readonly letters = 'Vane'.split('');

  protected readonly readouts = computed(() =>
    ['co2', 'temperature', 'humidity', 'pressure'].flatMap((id) => {
      const r = this.store.primary().readings.find((reading) => reading.id === id);
      return r ? [{ label: r.def.shortLabel, value: r.display, unit: r.unit }] : [];
    }),
  );

  private timeline?: gsap.core.Timeline;

  constructor() {
    afterNextRender(() => this.play());
    inject(DestroyRef).onDestroy(() => this.timeline?.kill());
  }

  protected skip(): void {
    this.timeline?.progress(1);
  }

  private play(): void {
    const root = this.root()?.nativeElement;
    if (!root) return;

    this.smooth.init();
    this.smooth.stop();

    const q = gsap.utils.selector(root);
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: () => this.end() });

    tl.from(q('.top'), { opacity: 0, duration: 0.6 }, 0)
      .fromTo(q('.sweep'), { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: 'power2.inOut' }, 0.15)
      .from(q('.readouts > div'), { opacity: 0, y: 10, stagger: 0.08, duration: 0.5 }, 0.2)
      .from(q('.ch'), { yPercent: 110, duration: 1, ease: 'power4.out', stagger: 0.07 }, 0.45);

    // Each readout counts from zero to its value, like a sensor settling.
    for (const el of q('.v') as HTMLElement[]) {
      const target = el.dataset['to'] ?? '0';
      const end = parseFloat(target.replace(/,/g, ''));
      const decimals = target.includes('.') ? target.split('.')[1].length : 0;
      const counter = { v: 0 };
      tl.to(
        counter,
        {
          v: end,
          duration: 1.4,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = counter.v.toLocaleString('en-US', {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            });
          },
        },
        0.3,
      );
    }

    // Lift the panel away and let the landing page start animating underneath.
    tl.addLabel('exit', 2.4)
      .to(q('.center, .bottom, .top'), { opacity: 0, y: -24, duration: 0.5, ease: 'power2.in' }, 'exit')
      .to(root, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'power4.inOut' }, 'exit+=0.2')
      .add(() => this.state.finish(), 'exit+=0.45');

    this.timeline = tl;
  }

  private end(): void {
    this.state.finish();
    this.smooth.start();
    this.visible.set(false);
  }
}
