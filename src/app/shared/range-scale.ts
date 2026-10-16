import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Segment } from '../core/models';

/** A bar split into healthy/unhealthy zones, with a needle at the current value. */
@Component({
  selector: 'app-range-scale',
  template: `
    <div class="track" role="img" [attr.aria-label]="label()">
      @for (seg of segments(); track seg.startPct) {
        <span class="seg" [attr.data-tone]="seg.tone" [attr.data-swatch]="seg.swatch" [style.flex-grow]="seg.widthPct"></span>
      }
      <span class="marker" [style.left.%]="markerPct()"></span>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .track {
      position: relative;
      display: flex;
      gap: 2px;
      height: 6px;
    }
    .seg {
      flex-basis: 0;
      background: var(--tone-fill);
    }
    /* Thermal zones (temperature) override the status color. */
    .seg[data-swatch='cold'] {
      background: var(--cold-fill);
    }
    .seg[data-swatch='comfort'] {
      background: var(--comfort-fill);
    }
    .seg[data-swatch='hot'] {
      background: var(--hot-fill);
    }
    .marker {
      position: absolute;
      top: 50%;
      width: 3px;
      height: 22px;
      background: var(--ink);
      transform: translate(-50%, -50%);
      box-shadow: 0 0 0 2px var(--paper);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RangeScale {
  readonly segments = input.required<Segment[]>();
  readonly markerPct = input.required<number>();
  readonly label = input('');
}
