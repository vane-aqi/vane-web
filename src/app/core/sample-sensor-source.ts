import { Injectable, signal } from '@angular/core';
import { ConnectionState, MonitorFeed, SensorSnapshot } from './models';
import { SensorSource } from './sensor-source';

type Values = Omit<SensorSnapshot, 'takenAt'>;

/** The original mockup's numbers. */
export const SAMPLE_SNAPSHOT: Values = {
  co2Ppm: 670,
  temperatureC: 19.4,
  humidityPct: 67,
  pressureHpa: 1013,
  coPpm: 28,
  isoprenePpb: 6,
  ethanePpb: 9,
};

/** A spread of rooms so every state shows up: fair, good, poor and offline. */
const SAMPLE_ROOMS: { id: string; name: string; values: Values | null }[] = [
  { id: 'living-room', name: 'Living room', values: SAMPLE_SNAPSHOT },
  {
    id: 'bedroom',
    name: 'Bedroom',
    values: { co2Ppm: 1180, temperatureC: 20.6, humidityPct: 44, pressureHpa: 1013, coPpm: 1, isoprenePpb: 0.6, ethanePpb: 1.1 },
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    values: { co2Ppm: 840, temperatureC: 23.2, humidityPct: 72, pressureHpa: 1012, coPpm: 12, isoprenePpb: 0.8, ethanePpb: 3.4 },
  },
  { id: 'office', name: 'Office', values: null },
];

/** Stand-in used until real monitors are available. */
@Injectable()
export class SampleSensorSource extends SensorSource {
  readonly isSample = true;

  private readonly _monitors = signal<MonitorFeed[]>(
    SAMPLE_ROOMS.map((room) => ({
      id: room.id,
      name: room.name,
      online: room.values !== null,
      snapshot: room.values ? { ...room.values, takenAt: new Date() } : null,
    })),
  );
  private readonly _connection = signal<ConnectionState>('disconnected');

  readonly monitors = this._monitors.asReadonly();
  readonly connection = this._connection.asReadonly();

  async connect(): Promise<void> {
    this._connection.set('connecting');
    await new Promise((resolve) => setTimeout(resolve, 2400));
    this._connection.set('disconnected');
    throw new Error('Device support is not set up yet.');
  }

  disconnect(): void {
    this._connection.set('disconnected');
  }
}
