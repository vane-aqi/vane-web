import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ReadingsStore } from '../../core/readings-store';
import { Theme } from '../../core/theme';
import { prefersReducedMotion } from '../../motion/gsap';
import { Vane } from '../vane';
import type { World } from './hero-world';
import { SceneData, TileData, drawDashboard, drawRooms, drawScreen, loadFonts, readPalette } from './panel-textures';

/** Which readings the miniature dashboard shows first. */
const TILE_ORDER = ['co2', 'pm25', 'temperature', 'humidity', 'gases', 'pm10', 'pressure'];

/**
 * The landing hero's centerpiece: a three.js scene of glass panels showing the
 * app, plus the monitor itself. three.js is loaded lazily and only where WebGL
 * works; elsewhere this shows the line-drawn vane instead.
 */
@Component({
  selector: 'app-hero-scene',
  imports: [Vane],
  template: `
    @if (fallback()) {
      <app-vane class="fallback" [play]="play()" [caption]="caption()" />
    } @else {
      <canvas #canvas aria-hidden="true"></canvas>
    }
  `,
  host: { '[class.lit]': 'play() && !fallback()' },
  styles: `
    :host {
      position: relative;
      display: block;
    }
    /* A soft wash of the brand's sky, sage and ochre behind the glass, so the
       panels have light to show through. Fades in with the entrance. */
    :host::before {
      content: '';
      position: absolute;
      inset: 10% 8%;
      background:
        radial-gradient(42% 46% at 34% 38%, color-mix(in srgb, var(--good-fill) 60%, transparent), transparent 72%),
        radial-gradient(38% 42% at 70% 66%, color-mix(in srgb, var(--comfort-fill) 65%, transparent), transparent 72%),
        radial-gradient(26% 30% at 78% 22%, color-mix(in srgb, var(--watch-fill) 40%, transparent), transparent 72%);
      filter: blur(28px);
      opacity: 0;
      transition: opacity 1.4s ease 0.2s;
      pointer-events: none;
    }
    :host(.lit)::before {
      opacity: 0.85;
    }
    canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .fallback {
      width: min(220px, 50%);
      margin: 0 auto;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroScene {
  /** Hold the entrance until the hero is ready (after the intro). */
  readonly play = input(true);

  private readonly store = inject(ReadingsStore);
  private readonly theme = inject(Theme);
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  protected readonly fallback = signal(!supportsWebGL());
  protected readonly caption = computed(() => {
    const m = this.store.primary();
    return `${m.name} · ${m.overall?.label ?? 'Offline'}`;
  });

  /** What the panels show, rebuilt whenever readings, units or rooms change. */
  private readonly data = computed<SceneData>(() => {
    const m = this.store.primary();
    const tiles = [...m.readings]
      .sort((a, b) => TILE_ORDER.indexOf(a.id) - TILE_ORDER.indexOf(b.id))
      .map<TileData>((r) => ({ label: r.def.shortLabel, value: r.display, unit: r.unit, status: r.status, tone: r.tone }));
    return {
      room: m.name,
      verdict: m.overall?.label ?? 'Offline',
      verdictTone: m.overall?.tone ?? null,
      sub: `${m.readings.length} readings · ${m.actions.length ? m.actions.length + ' to act on' : 'all in range'}`,
      tiles,
      rooms: this.store.monitors().map((r) => ({
        name: r.name,
        label: r.overall?.label ?? 'Offline',
        tone: r.overall?.tone ?? null,
        tones: r.readings.map((x) => x.tone),
      })),
    };
  });

  /** Which reading the device's LED screen is showing. */
  private readonly screenIndex = signal(0);

  private world?: World;
  private sources?: { dashboard: HTMLCanvasElement; rooms: HTMLCanvasElement; screen: HTMLCanvasElement };
  private starting = false;

  constructor() {
    // Build the scene once the canvas exists (any screen size with WebGL).
    effect(() => {
      if (this.fallback() || this.starting) return;
      const canvas = this.canvas()?.nativeElement;
      if (canvas) untracked(() => this.start(canvas));
    });

    // Keep the panels in sync with the data and the theme.
    effect(() => {
      const data = this.data();
      const dark = this.theme.mode() === 'dark';
      const index = this.screenIndex();
      untracked(() => this.draw(data, dark, index));
    });

    // Run the entrance when the hero says so.
    effect(() => {
      if (this.play()) untracked(() => this.world?.enter(!prefersReducedMotion()));
    });

    const timer = setInterval(() => this.screenIndex.update((i) => i + 1), 3200);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
      this.cleanup?.();
      this.world?.dispose();
    });
  }

  private async start(canvas: HTMLCanvasElement): Promise<void> {
    this.starting = true;
    this.sources = {
      dashboard: document.createElement('canvas'),
      rooms: document.createElement('canvas'),
      screen: document.createElement('canvas'),
    };
    await loadFonts();
    this.draw(this.data(), this.theme.mode() === 'dark', this.screenIndex());

    try {
      const { createWorld } = await import('./hero-world');
      this.world = createWorld(canvas, this.sources, { dark: this.theme.mode() === 'dark', still: prefersReducedMotion() });
    } catch {
      this.fallback.set(true);
      return;
    }

    // Only animate while the scene is on screen and the tab is visible.
    let onScreen = true;
    const update = () => this.world?.setRunning(onScreen && document.visibilityState === 'visible');
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      update();
    });
    io.observe(this.host);
    document.addEventListener('visibilitychange', update);
    update();
    if (this.play()) this.world.enter(!prefersReducedMotion());

    this.cleanup = () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }

  private cleanup?: () => void;

  private draw(data: SceneData, dark: boolean, index: number): void {
    if (!this.sources) return;
    const palette = readPalette();
    drawDashboard(this.sources.dashboard, data, palette);
    drawRooms(this.sources.rooms, data, palette);
    const tiles = data.tiles;
    const active = tiles.length ? index % tiles.length : 0;
    drawScreen(this.sources.screen, data.room, tiles[active], tiles.map((t) => t.tone), active, palette);
    this.world?.setTheme(dark);
    this.world?.refresh();
  }
}

function supportsWebGL(): boolean {
  if (typeof window === 'undefined' || !('WebGL2RenderingContext' in window)) return false;
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}
