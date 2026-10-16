import { Signal } from '@angular/core';
import { ConnectionState, MonitorFeed } from './models';

/**
 * The one boundary between the UI and the hardware.
 *
 * Components never talk to monitors directly. They read from `ReadingsStore`,
 * which reads from whichever `SensorSource` is provided in `app.config.ts`.
 * To support the real devices, write a new class that extends this one
 * (over HTTP, WebSocket, Web Bluetooth...) and swap it in there.
 */
export abstract class SensorSource {
  /** Every monitor the user has, one per room, with its latest reading. */
  abstract readonly monitors: Signal<MonitorFeed[]>;
  /** State of the "connect a new monitor" flow. */
  abstract readonly connection: Signal<ConnectionState>;
  /** True while showing made-up data instead of real devices. */
  abstract readonly isSample: boolean;

  abstract connect(): Promise<void>;
  abstract disconnect(): void;
}
