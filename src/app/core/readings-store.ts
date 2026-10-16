import { Injectable, computed, inject } from '@angular/core';
import {
  byUrgency,
  cToF,
  formatNumber,
  markerPct,
  overallHealth,
  segmentsFor,
  withUnit,
  worstTone,
  zoneFor,
} from './evaluate';
import { GAS_DEFINITIONS, METRIC_DEFINITIONS } from './metric-definitions';
import { GasReading, MetricDefinition, Monitor, MonitorFeed, Reading, SensorSnapshot, Tone } from './models';
import { Preferences } from './preferences';
import { SensorSource } from './sensor-source';

const GASES_STATUS: Record<Tone, string> = {
  good: 'All normal',
  watch: 'Slightly elevated',
  alert: 'Needs attention',
};

const NO_MONITOR: Monitor = {
  id: 'none',
  name: 'No monitors',
  online: false,
  takenAt: null,
  readings: [],
  overall: null,
  actions: [],
};

/**
 * Turns raw sensor numbers into what the screens show: formatted values,
 * statuses, advice and an overall verdict, for every monitor. Everything here
 * is a `computed` signal, so the UI updates on its own when new data arrives.
 */
@Injectable({ providedIn: 'root' })
export class ReadingsStore {
  private readonly source = inject(SensorSource);
  private readonly prefs = inject(Preferences);

  readonly connection = this.source.connection;
  readonly isSample = this.source.isSample;

  readonly monitors = computed<Monitor[]>(() => this.source.monitors().map((feed) => this.toMonitor(feed)));

  /** The first monitor that's online. The landing page and intro show this one. */
  readonly primary = computed(() => this.monitor(null));

  /** A monitor by id, falling back to the first online one. */
  monitor(id: string | null | undefined): Monitor {
    const all = this.monitors();
    return all.find((m) => m.id === id) ?? all.find((m) => m.online) ?? all[0] ?? NO_MONITOR;
  }

  connect() {
    return this.source.connect();
  }

  private toMonitor(feed: MonitorFeed): Monitor {
    const snapshot = feed.online ? feed.snapshot : null;
    const readings = snapshot ? METRIC_DEFINITIONS.map((def) => this.evaluate(def, snapshot)) : [];
    return {
      id: feed.id,
      name: feed.name,
      online: feed.online,
      takenAt: snapshot?.takenAt ?? null,
      readings,
      overall: readings.length ? overallHealth(readings.map((r) => r.tone)) : null,
      actions: readings.filter((r) => r.tone !== 'good').sort(byUrgency),
    };
  }

  private evaluate(def: MetricDefinition, snapshot: SensorSnapshot): Reading {
    const value = def.read(snapshot);
    const zone = zoneFor(def.scale, value);
    const goodZone = def.scale.zones.find((z) => z.tone === 'good');
    const shown = this.display(def, value);
    const gases = def.id === 'gases' ? this.evaluateGases(snapshot) : [];

    const reading: Reading = {
      id: def.id,
      def,
      value,
      display: shown.value,
      unit: shown.unit,
      tone: zone.tone,
      status: zone.status,
      advice: zone.advice,
      markerPct: markerPct(def.scale, value),
      segments: segmentsFor(def.scale),
      scaleMin: this.label(def, def.scale.min),
      scaleMax: this.label(def, def.scale.max),
      bounds: def.scale.zones.slice(1).map((z) => ({
        pct: ((z.from - def.scale.min) / (def.scale.max - def.scale.min)) * 100,
        label: this.label(def, z.from),
      })),
      healthy: goodZone ? this.rangeLabel(def, goodZone.from, goodZone.to) : '',
      gases,
    };

    // The gas group is as healthy as its worst gas.
    if (gases.length) {
      const worst = [...gases].sort(byUrgency)[0];
      reading.tone = worstTone(gases.map((g) => g.tone));
      reading.status = GASES_STATUS[reading.tone];
      reading.advice = worst.advice || 'Nothing to do. All monitored gases are at normal levels.';
    }
    return reading;
  }

  private evaluateGases(snapshot: SensorSnapshot): GasReading[] {
    return GAS_DEFINITIONS.map((def) => {
      const value = def.read(snapshot);
      const zone = zoneFor(def.scale, value);
      return {
        def,
        value,
        // Small gas values like 0.6 ppb need their decimal.
        display: formatNumber(value, Number.isInteger(value) ? 0 : 1),
        unit: def.unit,
        tone: zone.tone,
        status: zone.status,
        advice: zone.advice,
        markerPct: markerPct(def.scale, value),
        segments: segmentsFor(def.scale),
      };
    });
  }

  /** Temperature is stored in °C and converted for display. */
  private display(def: MetricDefinition, value: number) {
    if (def.id === 'temperature' && this.prefs.temperatureUnit() === 'F') {
      return { value: formatNumber(cToF(value)), unit: '°F' };
    }
    return { value: formatNumber(value, def.decimals), unit: def.unit };
  }

  private label(def: MetricDefinition, value: number): string {
    const { value: v, unit } = this.display(def, value);
    return withUnit(v.replace(/\.0$/, ''), unit);
  }

  private rangeLabel(def: MetricDefinition, from: number, to: number): string {
    if (from === def.scale.min) return `Below ${this.label(def, to)}`;
    const a = this.display(def, from).value.replace(/\.0$/, '');
    return `${a}–${this.label(def, to)}`;
  }
}
