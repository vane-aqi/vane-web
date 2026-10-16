import { OverallHealth, Scale, Segment, Tone, Zone } from './models';

const TONE_RANK: Record<Tone, number> = { good: 0, watch: 1, alert: 2 };

/** The zone a value falls in. Values past either end use the nearest zone. */
export function zoneFor(scale: Scale, value: number): Zone {
  const { zones } = scale;
  if (value < zones[0].from) return zones[0];
  return zones.find((z) => value >= z.from && value < z.to) ?? zones[zones.length - 1];
}

/** Where a value sits along its scale, as a percentage kept slightly inside the ends. */
export function markerPct(scale: Scale, value: number): number {
  const pct = ((value - scale.min) / (scale.max - scale.min)) * 100;
  return Math.min(98, Math.max(2, pct));
}

export function segmentsFor(scale: Scale): Segment[] {
  const span = scale.max - scale.min;
  return scale.zones.map((z) => ({
    startPct: ((z.from - scale.min) / span) * 100,
    widthPct: ((z.to - z.from) / span) * 100,
    tone: z.tone,
    swatch: z.swatch,
  }));
}

export function worstTone(tones: Tone[]): Tone {
  return tones.reduce<Tone>((worst, t) => (TONE_RANK[t] > TONE_RANK[worst] ? t : worst), 'good');
}

/** Sort comparator: alerts first, then watch, then good. */
export function byUrgency(a: { tone: Tone }, b: { tone: Tone }): number {
  return TONE_RANK[b.tone] - TONE_RANK[a.tone];
}

export function overallHealth(tones: Tone[]): OverallHealth {
  const counts: Record<Tone, number> = { good: 0, watch: 0, alert: 0 };
  for (const t of tones) counts[t]++;

  if (counts.alert >= 2) return { label: 'Poor', tone: 'alert', counts };
  if (counts.alert === 1 || counts.watch >= 2) return { label: 'Fair', tone: 'watch', counts };
  return { label: 'Good', tone: 'good', counts };
}

export const cToF = (c: number) => (c * 9) / 5 + 32;

export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** "67%" and "68°F" sit flush; "670 ppm" gets a space. */
export function withUnit(value: string, unit: string): string {
  return unit === '%' || unit.startsWith('°') ? `${value}${unit}` : `${value} ${unit}`;
}
