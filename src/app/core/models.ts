/** How healthy a value is. Drives every color and label in the UI. */
export type Tone = 'good' | 'watch' | 'alert';

export type MetricId = 'co2' | 'temperature' | 'humidity' | 'pressure' | 'gases';
export type GasId = 'co' | 'isoprene' | 'ethane';
export type TemperatureUnit = 'F' | 'C';
export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

export type IconName =
  | 'co2'
  | 'temperature'
  | 'humidity'
  | 'pressure'
  | 'gases'
  | 'arrow-right'
  | 'arrow-left'
  | 'device'
  | 'bulb'
  | 'mail'
  | 'check'
  | 'sun'
  | 'moon';

/**
 * One raw reading from the monitor, in the units the hardware reports.
 * When the real device arrives, map its payload onto this shape.
 */
export interface SensorSnapshot {
  co2Ppm: number;
  temperatureC: number;
  humidityPct: number;
  pressureHpa: number;
  coPpm: number;
  isoprenePpb: number;
  ethanePpb: number;
  takenAt: Date;
}

/** A band on a scale, with what to tell the user when a value falls in it. */
export interface Zone {
  from: number;
  to: number;
  tone: Tone;
  status: string;
  advice: string;
}

export interface Scale {
  min: number;
  max: number;
  zones: Zone[];
}

/** A zone expressed as a slice of the scale, ready for drawing. */
export interface Segment {
  startPct: number;
  widthPct: number;
  tone: Tone;
}

export interface MetricDefinition {
  id: MetricId;
  label: string;
  shortLabel: string;
  unit: string;
  decimals: number;
  icon: IconName;
  summary: string;
  about: string;
  whyItMatters: string;
  healthyRange: string;
  scale: Scale;
  read: (snapshot: SensorSnapshot) => number;
}

export interface GasDefinition {
  id: GasId;
  name: string;
  unit: string;
  about: string;
  typical: string;
  scale: Scale;
  read: (snapshot: SensorSnapshot) => number;
}

/** A value after it has been checked against its scale and formatted. */
interface Evaluated {
  value: number;
  display: string;
  unit: string;
  tone: Tone;
  status: string;
  advice: string;
  markerPct: number;
  segments: Segment[];
}

export interface GasReading extends Evaluated {
  def: GasDefinition;
}

export interface Reading extends Evaluated {
  id: MetricId;
  def: MetricDefinition;
  scaleMin: string;
  scaleMax: string;
  healthy: string;
  gases: GasReading[];
}

export interface OverallHealth {
  label: 'Good' | 'Fair' | 'Poor';
  tone: Tone;
  counts: Record<Tone, number>;
}

/** One physical monitor as the sensor source reports it. */
export interface MonitorFeed {
  id: string;
  /** The room it lives in, e.g. "Bedroom". */
  name: string;
  online: boolean;
  /** Latest reading, or null if it has never reported or is offline. */
  snapshot: SensorSnapshot | null;
}

/** A monitor after its readings have been evaluated. What the screens use. */
export interface Monitor {
  id: string;
  name: string;
  online: boolean;
  takenAt: Date | null;
  readings: Reading[];
  /** Null when there are no readings (offline). */
  overall: OverallHealth | null;
  /** Readings that need something done, most urgent first. */
  actions: Reading[];
}
