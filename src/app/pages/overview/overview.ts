import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { OverallHealth } from '../../core/models';
import { ReadingsStore } from '../../core/readings-store';
import { Flip } from '../../motion/flip';
import { gsap, prefersReducedMotion } from '../../motion/gsap';
import { Icon } from '../../shared/icon';
import { RangeScale } from '../../shared/range-scale';

@Component({
  selector: 'app-overview',
  imports: [RouterLink, DatePipe, Flip, Icon, RangeScale],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Overview {
  protected readonly store = inject(ReadingsStore);

  /** From the URL: /dashboard?room=kitchen. Falls back to the first online room. */
  readonly room = input<string>();
  protected readonly monitor = computed(() => this.store.monitor(this.room()));

  private readonly tray = viewChild<ElementRef<HTMLElement>>('tray');
  private readonly thumb = viewChild<ElementRef<HTMLElement>>('thumb');
  private readonly roomLinks = viewChildren<ElementRef<HTMLElement>>('roomLink');
  private thumbPlaced = false;

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

    // After each render, glide the room slider to the selected room.
    afterRenderEffect(() => {
      this.monitor().id;
      this.roomLinks();
      untracked(() => this.moveThumb(this.thumbPlaced));
    });

    // Widths change when fonts load or the window resizes; snap the slider back into place.
    const snap = () => this.moveThumb(false);
    afterNextRender(() => {
      document.fonts?.ready.then(snap);
      window.addEventListener('resize', snap);
    });

    inject(DestroyRef).onDestroy(() => {
      ctx?.revert();
      window.removeEventListener('resize', snap);
    });
  }

  /**
   * Slide the raised thumb under the active room. It travels with a slight
   * overshoot, like a real toggle settling into its detent.
   */
  private moveThumb(animate: boolean): void {
    const thumb = this.thumb()?.nativeElement;
    const active = this.roomLinks().find((l) => l.nativeElement.classList.contains('active'))?.nativeElement;
    if (!thumb || !active) return;

    const target = { x: active.offsetLeft, width: active.offsetWidth, autoAlpha: 1 };
    if (!animate || prefersReducedMotion()) {
      gsap.set(thumb, target);
    } else {
      gsap.to(thumb, { ...target, duration: 0.55, ease: 'back.out(1.4)', overwrite: true });
    }
    this.thumbPlaced = true;

    // On narrow screens the tray scrolls: keep the selected room in view.
    const tray = this.tray()?.nativeElement;
    if (tray && tray.scrollWidth > tray.clientWidth) {
      tray.scrollTo({ left: active.offsetLeft - 24, behavior: animate && !prefersReducedMotion() ? 'smooth' : 'auto' });
    }
  }

  /**
   * Tiles rise into place one after another; range needles sweep to their values.
   * fromTo with explicit end states means an interrupted run (e.g. a quick room
   * switch) still lands every tile in place, and clearProps hands the transform
   * back to CSS afterwards so hover and press effects work.
   */
  private enter(roomChange = false): void {
    const rise = (y: number) => ({ autoAlpha: 0, y });
    const settle = { autoAlpha: 1, y: 0, clearProps: 'transform,opacity,visibility' };
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo('.head, .verdict, .offline', rise(14), { ...settle, duration: 0.45, stagger: 0.05 })
      .fromTo('.row', rise(14), { ...settle, duration: 0.4, stagger: 0.03 }, 0.06)
      .fromTo('.todo, .todo li', rise(12), { ...settle, duration: 0.4, stagger: 0.04 }, 0.15);
    if (!roomChange) {
      tl.from('.marker', { left: '0%', duration: 0.7, ease: 'power3.inOut', stagger: 0.03 }, 0.15).fromTo(
        '.sample, .rooms',
        rise(8),
        { ...settle, duration: 0.4, stagger: 0.05 },
        0,
      );
    }
  }
}
