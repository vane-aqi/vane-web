/** How healthy a value is. Drives every color and label in the UI. */
export type Tone = 'good' | 'watch' | 'alert';

export type MetricId = 'co2' | 'pm25' | 'pm10' | 'temperature' | 'humidity' | 'pressure' | 'gases';
export type GasId = 'co' | 'isoprene' | 'ethane';
export type TemperatureUnit = 'F' | 'C';
export type ConnectionState = 'disconnected' | 'connecting' | 'connected';
export type DataSource = 'sample' | 'mock' | 'live';

export type IconName =
  | 'co2'
  | 'temperature'
  | 'humidity'
  | 'pressure'
  | 'gases'
  | 'particles'
  | 'arrow-right'
  | 'arrow-left'
  | 'device'
  | 'bulb'
  | 'mail'
  | 'check'
  | 'sun'
  | 'moon';

/**
 * One raw reading from a monitor. Every sensor is optional: a monitor only
 * reports what it has (the current hardware sends temperature, humidity,
 * PM2.5 and PM10), and the app shows exactly those readings.
 */
export interface SensorSnapshot {
  co2Ppm?: number;
  temperatureC?: number;
  humidityPct?: number;
  pressureHpa?: number;
  /** Fine particles, µg/m³. */
  pm25?: number;
  /** Coarse particles, µg/m³. */
  pm10?: number;
  coPpm?: number;
  isoprenePpb?: number;
  ethanePpb?: number;
  takenAt: Date;
}

/**
 * Optional color for a zone on its scale, used instead of the status tone.
 * Temperature uses these so cold reads blue and hot reads red, as people expect.
 */
export type Swatch = 'cold' | 'comfort' | 'hot';

/** A band on a scale, with what to tell the user when a value falls in it. */
export interface Zone {
  from: number;
  to: number;
  tone: Tone;
  status: string;
  advice: string;
  swatch?: Swatch;
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
  swatch?: Swatch;
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
  read: (snapshot: SensorSnapshot) => number | undefined;
}

export interface GasDefinition {
  id: GasId;
  name: string;
  unit: string;
  about: string;
  typical: string;
  scale: Scale;
  read: (snapshot: SensorSnapshot) => number | undefined;
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
  /** Where one zone ends and the next begins, as a position on the scale plus a display label. */
  bounds: { pct: number; label: string }[];
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
  /** True for made-up data (sample rooms, or the bridge's mock monitors). */
  simulated?: boolean;
  /** The serial port it's plugged into, when it comes from the bridge. */
  portPath?: string;
}

/** A serial port the bridge can see, for the "connect a monitor" flow. */
export interface SerialPortInfo {
  path: string;
  manufacturer: string | null;
  inUse: boolean;
}

export interface ConnectRequest {
  portPath: string;
  /** The room it's going in, e.g. "Bedroom". */
  name: string;
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
