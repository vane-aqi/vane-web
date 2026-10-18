import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ReadingsStore } from '../core/readings-store';
import { Flip } from '../motion/flip';

/**
 * A drawn stand-in for the Vane Monitor: a small matte device with an LED
 * screen that cycles through the main room's readings (flipping like the rest
 * of the site), an air-intake grille and a status light in the overall tone.
 * Everything is sized in container units, so it scales with its own width.
 */
@Component({
  selector: 'app-device-render',
  imports: [Flip],
  template: `
    @let room = store.primary();
    <div class="device" role="img" [attr.aria-label]="'Illustration of the Vane Monitor showing ' + room.name + ' readings'">
      <div class="body" [attr.data-tone]="room.overall?.tone" aria-hidden="true">
        <div class="screen">
          <div class="screen-top">
            <span class="room">{{ room.name }}</span>
            <span class="bars">
              @for (r of room.readings; track r.id; let i = $index) {
                <i [attr.data-tone]="r.tone" [class.on]="i === index()"></i>
              }
            </span>
          </div>
          @if (current(); as r) {
            <p class="label" [appFlip]="r.def.shortLabel"></p>
            <p class="value"><span [appFlip]="r.display"></span><span class="unit" [appFlip]="r.unit"></span></p>
            <p class="status" [appFlip]="r.status"></p>
          } @else {
            <p class="label">Offline</p>
          }
        </div>
        <div class="grille"></div>
        <span class="light"></span>
      </div>
      <span class="ground" aria-hidden="true"></span>
    </div>
  `,
  styles: `
    :host {
      display: block;
      --dev-hi: #fbfbf8;
      --dev-lo: #e2e4de;
      --dev-edge: #c7cbc3;
      --dev-hole: rgb(15 21 18 / 0.3);
      --dev-ground: rgb(15 21 18 / 0.2);
      --led: #c8f0d6;
    }
    :host-context([data-theme='dark']) {
      --dev-hi: #3a413d;
      --dev-lo: #232926;
      --dev-edge: #121614;
      --dev-hole: rgb(0 0 0 / 0.6);
      --dev-ground: rgb(0 0 0 / 0.55);
    }
    .device {
      container-type: inline-size;
    }

    /* Matte body; the solid shadow underneath reads as the device's thickness. */
    .body {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 7cqw;
      aspect-ratio: 4 / 5;
      padding: 9cqw 9cqw 12cqw;
      border-radius: 13cqw;
      background: linear-gradient(165deg, var(--dev-hi) 0%, var(--dev-lo) 100%);
      box-shadow:
        inset 0 0.6cqw 0 rgb(255 255 255 / 0.55),
        inset 0 -2cqw 5cqw rgb(0 0 0 / 0.07),
        0 3.5cqw 0 var(--dev-edge);
    }

    /* Recessed LED screen with a bezel and a faint glass sheen. */
    .screen {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 1.6cqw;
      aspect-ratio: 5 / 4;
      padding: 6cqw 8cqw;
      border-radius: 6cqw;
      background: #0b100e;
      box-shadow:
        inset 0 0 0 1.2cqw #161c19,
        inset 0 2cqw 6cqw rgb(0 0 0 / 0.7);
      color: var(--led);
      /* Solid flaps in the screen color, split by a dark hinge, like a real flip display. */
      --flip-bg: #0b100e;
      --flip-hinge: rgb(0 0 0 / 0.85);
      font-family: var(--font-mono);
      text-shadow: 0 0 2.2cqw color-mix(in srgb, var(--led) 50%, transparent);
      overflow: hidden;
    }
    .screen::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(140deg, rgb(255 255 255 / 0.08), transparent 38%);
      pointer-events: none;
    }
    .screen-top {
      position: absolute;
      top: 5.5cqw;
      left: 8cqw;
      right: 8cqw;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 3.6cqw;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      opacity: 0.6;
    }
    .bars {
      display: flex;
      gap: 1cqw;
    }
    .bars i {
      width: 3.4cqw;
      height: 1.2cqw;
      background: var(--tone-dot);
      opacity: 0.4;
      box-shadow: none;
      transition: opacity 0.3s ease;
    }
    .bars i.on {
      opacity: 1;
    }
    .screen p {
      margin: 0;
    }
    .label {
      margin-top: 4cqw !important;
      font-size: 4.6cqw;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      opacity: 0.75;
    }
    .value {
      font-size: 19cqw;
      font-weight: 500;
      line-height: 1;
      letter-spacing: -0.04em;
      font-variant-numeric: tabular-nums;
    }
    .unit {
      margin-left: 2cqw;
      font-size: 5cqw;
      letter-spacing: 0.04em;
      opacity: 0.75;
    }
    .status {
      font-size: 4.2cqw;
      opacity: 0.7;
    }

    /* Air intake: a field of small holes. */
    .grille {
      flex: 1;
      margin: 0 4cqw;
      background-image: radial-gradient(circle, var(--dev-hole) 0.85cqw, transparent 1.05cqw);
      background-size: 4.6cqw 4.6cqw;
      background-repeat: space;
    }

    /* Status light: a small bar in the room's overall tone. */
    .light {
      position: absolute;
      left: 50%;
      bottom: 5cqw;
      width: 12cqw;
      height: 1cqw;
      border-radius: 1cqw;
      background: var(--tone-dot, var(--muted));
      box-shadow: 0 0 2.5cqw var(--tone-dot, transparent);
      transform: translateX(-50%);
    }

    .ground {
      display: block;
      width: 86%;
      height: 7cqw;
      margin: 5cqw auto 0;
      border-radius: 50%;
      background: radial-gradient(closest-side, var(--dev-ground), transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceRender {
  protected readonly store = inject(ReadingsStore);

  /** Which reading the screen is showing; advances every few seconds. */
  protected readonly index = signal(0);
  protected readonly current = computed(() => {
    const readings = this.store.primary().readings;
    return readings.length ? readings[this.index() % readings.length] : null;
  });

  constructor() {
    let timer: ReturnType<typeof setInterval> | undefined;
    afterNextRender(() => {
      timer = setInterval(() => this.index.update((i) => i + 1), 3200);
    });
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
