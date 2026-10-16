import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ReadingsStore } from '../../core/readings-store';
import { ArcGauge } from '../../shared/arc-gauge';
import { Icon } from '../../shared/icon';
import { mediaQuery } from '../../shared/media-query';
import { Flip } from '../../motion/flip';
import { Reveal } from '../../motion/reveal';
import { RangeScale } from '../../shared/range-scale';
import { Thermometer } from '../../shared/thermometer';

/**
 * One reading, laid out to fit a single screen. On phones the supporting
 * sections start collapsed so the value and the advice are visible without scrolling.
 */
@Component({
  selector: 'app-reading-detail',
  imports: [RouterLink, RouterLinkActive, ArcGauge, Flip, Icon, RangeScale, Reveal, Thermometer],
  templateUrl: './reading-detail.html',
  styleUrl: './reading-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadingDetail {
  protected readonly store = inject(ReadingsStore);

  /** Filled from the `:id` in the URL, thanks to withComponentInputBinding() in app.config.ts. */
  readonly id = input.required<string>();
  /** From the URL too: /readings/gases?room=kitchen. */
  readonly room = input<string>();

  protected readonly monitor = computed(() => this.store.monitor(this.room()));
  protected readonly reading = computed(() => this.monitor().readings.find((r) => r.id === this.id()));
  protected readonly compact = mediaQuery('(max-width: 699px)');
}
