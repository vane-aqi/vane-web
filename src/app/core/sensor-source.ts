import { Signal } from '@angular/core';
import { ConnectRequest, ConnectionState, DataSource, MonitorFeed, SerialPortInfo } from './models';

/**
 * The one boundary between the UI and the hardware.
 *
 * Components never talk to monitors directly. They read from `ReadingsStore`,
 * which reads from whichever `SensorSource` is provided in `app.config.ts`.
 * `BridgeSensorSource` talks to real monitors through the bridge server in
 * `bridge/`; `SampleSensorSource` makes up data for demos and tests.
 */
export abstract class SensorSource {
  /** Every monitor the user has, one per room, with its latest reading. */
  abstract readonly monitors: Signal<MonitorFeed[]>;
  /** State of the "connect a new monitor" flow. */
  abstract readonly connection: Signal<ConnectionState>;
  /**
   * Where the readings come from: 'sample' (made-up rooms), 'mock' (the bridge's
   * test monitors) or 'live' (real monitors).
   */
  abstract readonly dataSource: Signal<DataSource>;
  /** Whether new monitors can be connected right now (the bridge is running). */
  abstract readonly canConnect: Signal<boolean>;

  /** Serial ports a monitor could be plugged into. */
  abstract listPorts(): Promise<SerialPortInfo[]>;
  /** Start reading a monitor on a port, named after its room. */
  abstract connect(request: ConnectRequest): Promise<void>;
  abstract disconnect(monitorId: string): Promise<void>;
}
