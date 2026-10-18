import { Injectable, signal } from '@angular/core';
import { ConnectRequest, ConnectionState, DataSource, MonitorFeed, SensorSnapshot, SerialPortInfo } from './models';
import { SensorSource } from './sensor-source';

type Values = Omit<SensorSnapshot, 'takenAt'>;

/** The original mockup's numbers, plus particle readings. */
export const SAMPLE_SNAPSHOT: Values = {
  co2Ppm: 670,
  temperatureC: 19.4,
  humidityPct: 67,
  pressureHpa: 1013,
  pm25: 7.8,
  pm10: 22,
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
    values: {
      co2Ppm: 1180,
      temperatureC: 20.6,
      humidityPct: 44,
      pressureHpa: 1013,
      pm25: 4.2,
      pm10: 11,
      coPpm: 1,
      isoprenePpb: 0.6,
      ethanePpb: 1.1,
    },
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    values: {
      co2Ppm: 840,
      temperatureC: 23.2,
      humidityPct: 72,
      pressureHpa: 1012,
      pm25: 41,
      pm10: 88,
      coPpm: 12,
      isoprenePpb: 0.8,
      ethanePpb: 3.4,
    },
  },
  { id: 'office', name: 'Office', values: null },
];

export function sampleMonitors(): MonitorFeed[] {
  return SAMPLE_ROOMS.map((room) => ({
    id: room.id,
    name: room.name,
    online: room.values !== null,
    simulated: true,
    snapshot: room.values ? { ...room.values, takenAt: new Date() } : null,
  }));
}

/** Made-up rooms for demos and tests. It can't connect real monitors. */
@Injectable()
export class SampleSensorSource extends SensorSource {
  readonly monitors = signal<MonitorFeed[]>(sampleMonitors()).asReadonly();
  readonly connection = signal<ConnectionState>('disconnected').asReadonly();
  readonly dataSource = signal<DataSource>('sample').asReadonly();
  readonly canConnect = signal(false).asReadonly();

  listPorts(): Promise<SerialPortInfo[]> {
    return Promise.reject(new Error(BRIDGE_NEEDED));
  }

  connect(_request: ConnectRequest): Promise<void> {
    return Promise.reject(new Error(BRIDGE_NEEDED));
  }

  disconnect(): Promise<void> {
    return Promise.resolve();
  }
}

export const BRIDGE_NEEDED = 'Start the Vane bridge on this computer to connect a monitor.';
