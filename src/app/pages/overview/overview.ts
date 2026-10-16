import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { OverallHealth } from '../../core/models';
import { ReadingsStore } from '../../core/readings-store';
import { gsap, prefersReducedMotion } from '../../motion/gsap';
import { Icon } from '../../shared/icon';
import { RangeScale } from '../../shared/range-scale';

@Component({
  selector: 'app-overview',
  imports: [RouterLink, DatePipe, Icon, RangeScale],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Overview {
  protected readonly store = inject(ReadingsStore);

  /** From the URL: /dashboard?room=kitchen. Falls back to the first online room. */
  readonly room = input<string>();
  protected readonly monitor = computed(() => this.store.monitor(this.room()));

  protected summary(o: OverallHealth): string {
    const { alert, watch } = o.counts;
    const parts = [];
    if (alert) parts.push(`${alert} need${alert === 1 ? 's' : ''} attention`);
    if (watch) parts.push(`${watch} worth a look`);
    return parts.length ? parts.join(', ') : 'Everything in range';
  }

  constructor() {
    const host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    let ctx: gsap.Context | undefined;

    afterNextRender(() => {
      if (prefersReducedMotion()) return;
      ctx = gsap.context(() => this.enter(), host);
    });

    // Switching rooms replays the panel's entrance so the change is felt, not just seen.
    let lastRoom: string | undefined;
    effect(() => {
      const id = this.monitor().id;
      untracked(() => {
        if (lastRoom !== undefined && lastRoom !== id && ctx) {
          // Wait one frame for the new room's rows to render.
          requestAnimationFrame(() => ctx?.add(() => this.enter(true)));
        }
        lastRoom = id;
      });
    });

    inject(DestroyRef).onDestroy(() => ctx?.revert());
  }

  private enter(roomChange = false): void {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.head > *', { autoAlpha: 0, y: 16, duration: 0.7, stagger: 0.08 })
      .from('.panel, .todo, .offline', { '--rule': 0, duration: 1.1, ease: 'power3.inOut' }, 0.05)
      .from('.row, .sub li', { autoAlpha: 0, y: 12, duration: 0.6, stagger: 0.05 }, 0.15)
      .from('.marker', { left: '0%', duration: 1.2, ease: 'power3.inOut', stagger: 0.05 }, 0.25)
      .from('.todo li, .offline > *', { autoAlpha: 0, y: 12, duration: 0.6, stagger: 0.08 }, 0.35);
    if (!roomChange) {
      tl.from('.rooms', { '--rule': 0, duration: 1.1, ease: 'power3.inOut' }, 0).from(
        '.room',
        { autoAlpha: 0, y: 10, duration: 0.6, stagger: 0.06 },
        0.1,
      );
    }
  }
}
