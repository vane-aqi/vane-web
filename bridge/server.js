'use strict';

/**
 * Vane bridge.
 *
 * Browsers can't read serial ports, so this small server does it for them.
 * Each Vane monitor plugs in over USB and prints one JSON object per line:
 *
 *   {"temperature": 25.5, "humidity": 60, "pm25": 35, "pm10": 50}
 *
 * The bridge keeps one connection per monitor (one per room) and streams every
 * monitor's latest reading to the web app with server-sent events.
 *
 *   npm start          real serial ports
 *   npm run mock       two fake monitors on fake ports, for trying it without hardware
 *
 * API (all JSON):
 *   GET    /api/health              { ok: true }
 *   GET    /api/ports               serial ports on this computer
 *   GET    /api/monitors            every monitor and its latest reading
 *   GET    /api/monitors/stream     the same list, pushed on every change (text/event-stream)
 *   POST   /api/monitors            connect one: { "portPath": "/dev/tty.usbserial-1", "name": "Bedroom" }
 *   DELETE /api/monitors/:id        disconnect one
 */

const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { SerialPort, SerialPortMock } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'device-config.json'), 'utf8'));
const MOCK = process.argv.includes('--mock');
const PORT = Number(process.env.PORT) || config.server.port;
const BAUD_RATE = config.device.baudRate;
const STALE_AFTER_MS = config.device.staleAfterMs;
const Port = MOCK ? SerialPortMock : SerialPort;

/** id -> { id, name, portPath, port, reading, lastSeen, error, closing, retries } */
const monitors = new Map();
/** Open server-sent-event responses. */
const clients = new Set();

// ---------------------------------------------------------------------------
// Device data
// ---------------------------------------------------------------------------

/**
 * Turn one line from a device into the app's reading fields. Only fields the
 * device actually sent are included; a missing sensor stays missing rather
 * than turning into 0. Throws if the line isn't usable.
 */
function parseLine(line) {
  const raw = JSON.parse(line);
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
  let temperatureC = num(raw.temperature);
  if (temperatureC !== undefined && config.device.temperatureUnit === 'fahrenheit') {
    temperatureC = ((temperatureC - 32) * 5) / 9;
  }
  const reading = {
    temperatureC,
    humidityPct: num(raw.humidity),
    pm25: num(raw.pm25),
    pm10: num(raw.pm10),
    // Not sent by the current device, but read if newer firmware adds them.
    co2Ppm: num(raw.co2),
    pressureHpa: num(raw.pressure),
    coPpm: num(raw.co),
    isoprenePpb: num(raw.isoprene),
    ethanePpb: num(raw.ethane),
  };
  for (const key of Object.keys(reading)) if (reading[key] === undefined) delete reading[key];
  if (!Object.keys(reading).length) throw new Error('No known sensor fields');
  return reading;
}

/** What the web app sees for one monitor. */
function toFeed(m) {
  const fresh = m.lastSeen !== null && Date.now() - m.lastSeen < STALE_AFTER_MS;
  const online = Boolean(m.port && m.port.isOpen) && fresh;
  return {
    id: m.id,
    name: m.name,
    portPath: m.portPath,
    online,
    simulated: MOCK,
    error: m.error,
    lastSeen: m.lastSeen ? new Date(m.lastSeen).toISOString() : null,
    snapshot: online && m.reading ? { ...m.reading, takenAt: new Date(m.lastSeen).toISOString() } : null,
  };
}

function list() {
  return [...monitors.values()].map(toFeed);
}

function broadcast() {
  const message = `event: monitors\ndata: ${JSON.stringify(list())}\n\n`;
  for (const res of clients) res.write(message);
}

// ---------------------------------------------------------------------------
// Serial connections
// ---------------------------------------------------------------------------

function slugFor(name) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'monitor';
  let id = base;
  for (let n = 2; monitors.has(id); n++) id = `${base}-${n}`;
  return id;
}

function openPort(portPath) {
  return new Promise((resolve, reject) => {
    const port = new Port({ path: portPath, baudRate: BAUD_RATE, autoOpen: false });
    port.open((err) => (err ? reject(err) : resolve(port)));
  });
}

async function attach(m) {
  const port = await openPort(m.portPath);
  m.port = port;
  m.retries = 0;
  m.error = null;

  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
  parser.on('data', (line) => {
    const text = String(line).trim();
    if (!text) return;
    try {
      m.reading = { ...m.reading, ...parseLine(text) };
      m.lastSeen = Date.now();
      m.error = null;
    } catch {
      m.error = 'The monitor sent data the bridge could not read.';
    }
    broadcast();
  });

  port.on('error', (err) => {
    m.error = err.message;
    broadcast();
  });

  port.on('close', () => {
    broadcast();
    if (!m.closing) reconnect(m);
  });

  if (MOCK) startFakeFirmware(m);
}

/** Unplugged or crashed? Try a few times before giving up. */
function reconnect(m) {
  if (m.retries >= config.device.reconnectAttempts) {
    m.error = 'Lost connection to the monitor.';
    broadcast();
    return;
  }
  m.retries += 1;
  setTimeout(() => {
    if (!monitors.has(m.id) || m.closing) return;
    attach(m).catch((err) => {
      m.error = err.message;
      reconnect(m);
    });
  }, config.device.reconnectDelayMs);
}

async function connectMonitor({ portPath, name }) {
  if ([...monitors.values()].some((m) => m.portPath === portPath)) {
    const err = new Error('That port is already connected.');
    err.status = 409;
    throw err;
  }
  const m = {
    id: slugFor(name),
    name,
    portPath,
    port: null,
    reading: null,
    lastSeen: null,
    error: null,
    closing: false,
    retries: 0,
  };
  await attach(m);
  monitors.set(m.id, m);
  broadcast();
  return toFeed(m);
}

function disconnectMonitor(id) {
  const m = monitors.get(id);
  if (!m) return false;
  m.closing = true;
  clearInterval(m.fakeTimer);
  monitors.delete(id);
  if (m.port && m.port.isOpen) m.port.close();
  broadcast();
  return true;
}

// ---------------------------------------------------------------------------
// Mock mode: fake ports with fake firmware printing JSON lines
// ---------------------------------------------------------------------------

const MOCK_PORTS = ['/dev/vane-mock-1', '/dev/vane-mock-2'];

function setUpMockPorts() {
  for (const p of MOCK_PORTS) SerialPortMock.binding.createPort(p, { echo: false, record: false });
}

function startFakeFirmware(m) {
  const base = m.portPath.endsWith('2')
    ? { temperature: 24.6, humidity: 58, pm25: 14, pm10: 41 }
    : { temperature: 21.3, humidity: 44, pm25: 6.2, pm10: 18 };
  const jitter = (v, spread) => Math.round((v + (Math.random() - 0.5) * spread) * 10) / 10;
  clearInterval(m.fakeTimer);
  m.fakeTimer = setInterval(() => {
    if (!m.port || !m.port.isOpen) return;
    const line = JSON.stringify({
      temperature: jitter(base.temperature, 0.6),
      humidity: Math.round(jitter(base.humidity, 3)),
      pm25: jitter(base.pm25, 2),
      pm10: Math.round(jitter(base.pm10, 6)),
    });
    m.port.port.emitData(`${line}\n`);
  }, 2000);
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, mock: MOCK }));

app.get('/api/ports', async (req, res) => {
  try {
    const ports = await Port.list();
    const used = new Set([...monitors.values()].map((m) => m.portPath));
    res.json(ports.map((p) => ({ path: p.path, manufacturer: p.manufacturer ?? null, inUse: used.has(p.path) })));
  } catch (err) {
    res.status(500).json({ error: 'Could not list serial ports.', details: err.message });
  }
});

app.get('/api/monitors', (req, res) => res.json(list()));

app.get('/api/monitors/stream', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders();
  res.write(`event: monitors\ndata: ${JSON.stringify(list())}\n\n`);
  clients.add(res);
  req.on('close', () => clients.delete(res));
});

app.post('/api/monitors', async (req, res) => {
  const portPath = typeof req.body?.portPath === 'string' ? req.body.portPath.trim() : '';
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 40) : '';
  if (!portPath || !name) {
    return res.status(400).json({ error: 'Both a port and a room name are required.' });
  }
  try {
    res.status(201).json(await connectMonitor({ portPath, name }));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Could not open that port.', details: err.message });
  }
});

app.delete('/api/monitors/:id', (req, res) => {
  if (!disconnectMonitor(req.params.id)) return res.status(404).json({ error: 'No monitor with that id.' });
  res.status(204).end();
});

// Serve the built web app too, so one command runs everything (`npm run build` in the app first).
const webApp = path.join(__dirname, '..', 'dist', 'vane', 'browser');
if (fs.existsSync(webApp)) {
  app.use(express.static(webApp));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(webApp, 'index.html'));
  });
}

function start() {
  // Re-send every few seconds so monitors that go quiet show as offline, and connections stay open.
  setInterval(broadcast, 5000);
  if (MOCK) setUpMockPorts();

  app.listen(PORT, async () => {
    console.log(`Vane bridge on http://localhost:${PORT}${MOCK ? ' (mock monitors)' : ''}`);
    // Monitors listed in device-config.json connect on start-up.
    for (const entry of config.monitors ?? []) {
      try {
        await connectMonitor(entry);
        console.log(`Connected ${entry.name} on ${entry.portPath}`);
      } catch (err) {
        console.error(`Could not connect ${entry.name} on ${entry.portPath}: ${err.message}`);
      }
    }
  });
}

// Only start when run directly (`node server.js`), not when imported by tests.
if (require.main === module) start();

module.exports = { parseLine };
