import { Injectable, computed, signal } from '@angular/core';
import { ConnectRequest, ConnectionState, DataSource, MonitorFeed, SensorSnapshot, SerialPortInfo } from './models';
import { BRIDGE_NEEDED, sampleMonitors } from './sample-sensor-source';
import { SensorSource } from './sensor-source';

/** Where the bridge lives. In development `ng serve` proxies /api to it (see proxy.conf.json). */
const API = '/api';

/** One monitor as the bridge sends it (dates arrive as ISO strings). */
interface WireMonitor {
  id: string;
  name: string;
  portPath: string;
  online: boolean;
  simulated: boolean;
  snapshot: (Omit<SensorSnapshot, 'takenAt'> & { takenAt: string }) | null;
}

/**
 * Real monitors, read through the bridge server in `bridge/`.
 *
 * The bridge pushes the full monitor list over server-sent events whenever a
 * reading arrives. While the bridge isn't running, or has no monitors yet,
 * this falls back to the sample rooms so the app always has something to show.
 * EventSource reconnects on its own, so starting the bridge later just works.
 */
@Injectable()
export class BridgeSensorSource extends SensorSource {
  /** Null while the bridge can't be reached. */
  private readonly live = signal<MonitorFeed[] | null>(null);
  private readonly sample = sampleMonitors();
  private readonly _connection = signal<ConnectionState>('disconnected');

  readonly connection = this._connection.asReadonly();
  readonly canConnect = computed(() => this.live() !== null);
  readonly monitors = computed(() => {
    const live = this.live();
    return live && live.length ? live : this.sample;
  });
  readonly dataSource = computed<DataSource>(() => {
    const live = this.live();
    if (!live || !live.length) return 'sample';
    return live.every((m) => m.simulated) ? 'mock' : 'live';
  });

  private events?: EventSource;
  private watchdog?: ReturnType<typeof setTimeout>;

  constructor() {
    super();
    if (typeof EventSource === 'undefined') return;
    this.open();
  }

  private open(): void {
    this.events?.close();
    const events = new EventSource(`${API}/monitors/stream`);
    events.addEventListener('monitors', (e) => {
      this.live.set((JSON.parse(e.data) as WireMonitor[]).map(fromWire));
      this.arm();
    });
    events.onerror = () => this.live.set(null);
    this.events = events;
    this.arm();
  }

  /**
   * The bridge sends an update at least every 5 seconds. If 12 go by with nothing
   * (it stopped, and a proxy is holding the connection open), treat it as gone and reconnect.
   */
  private arm(): void {
    clearTimeout(this.watchdog);
    this.watchdog = setTimeout(() => {
      this.live.set(null);
      this.open();
    }, 12000);
  }

  async listPorts(): Promise<SerialPortInfo[]> {
    return request<SerialPortInfo[]>(`${API}/ports`);
  }

  async connect(req: ConnectRequest): Promise<void> {
    this._connection.set('connecting');
    try {
      await request(`${API}/monitors`, { method: 'POST', body: JSON.stringify(req) });
    } finally {
      this._connection.set('disconnected');
    }
  }

  async disconnect(monitorId: string): Promise<void> {
    await request(`${API}/monitors/${encodeURIComponent(monitorId)}`, { method: 'DELETE' });
  }
}

function fromWire(m: WireMonitor): MonitorFeed {
  return {
    id: m.id,
    name: m.name,
    portPath: m.portPath,
    online: m.online,
    simulated: m.simulated,
    snapshot: m.snapshot ? { ...m.snapshot, takenAt: new Date(m.snapshot.takenAt) } : null,
  };
}

/** fetch with JSON, turning the bridge's { error } replies into readable errors. */
async function request<T = unknown>(url: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } });
  } catch {
    throw new Error(BRIDGE_NEEDED);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? BRIDGE_NEEDED);
  return body as T;
}
