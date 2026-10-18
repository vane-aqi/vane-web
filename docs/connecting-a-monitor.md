# Connecting a Vane monitor

How a monitor gets its readings into the Vane app, what the firmware has to send, and how to add or tune a reading.

```
monitor ──USB serial──▶ bridge (Node, port 3000) ──server-sent events──▶ web app
```

Browsers can't read serial ports, so a small Node server, the **bridge** (`bridge/server.js`), reads each monitor and pushes its readings to the app. One bridge handles any number of monitors, one per room.

---

## Quick start

```bash
npm install                    # app dependencies (once)
npm install --prefix bridge    # bridge dependencies (once)

npm run bridge                 # terminal 1: the bridge, reading real serial ports
npm start                      # terminal 2: the app at http://localhost:4200
```

Plug the monitor in, open **Monitors** in the app, pick its port, type the room name and press **Connect monitor**. Readings appear on the dashboard within a few seconds.

**No hardware?** Run `npm run bridge:mock` instead of `npm run bridge`. It creates two fake monitors on fake ports (`/dev/vane-mock-1`, `/dev/vane-mock-2`) that send changing readings every 2 seconds.

---

## 1. What the firmware must send

| Setting | Value |
| --- | --- |
| Transport | USB serial |
| Baud rate | 9600 (8 data bits, no parity, 1 stop bit) |
| Framing | One JSON object per line, ending in `\n` |
| Rate | One line every 1–2 seconds |

Example line:

```json
{"temperature": 21.4, "humidity": 45, "pm25": 6.2, "pm10": 18}
```

### Fields

All fields are optional. Send only the sensors the monitor has; the app shows exactly those readings and nothing else.

| JSON field | Meaning | Unit | Current hardware |
| --- | --- | --- | --- |
| `temperature` | Air temperature | °C (see `temperatureUnit` below) | yes |
| `humidity` | Relative humidity | % | yes |
| `pm25` | Fine particles, PM2.5 | µg/m³ | yes |
| `pm10` | Coarse particles, PM10 | µg/m³ | yes |
| `co2` | Carbon dioxide | ppm | no |
| `pressure` | Air pressure | hPa | no |
| `co` | Carbon monoxide | ppm | no |
| `isoprene` | Isoprene | ppb | no |
| `ethane` | Ethane | ppb | no |

### Rules

- **Values must be JSON numbers.** `"pm25": 6.2` is read; `"pm25": "6.2"` is ignored.
- **Leave out a sensor you can't read.** Don't send `0`; 0 is a real (and very good) reading.
- **A line can be partial.** Fields are merged with the last known values, so a line with only `{"pm25": 7}` updates PM2.5 and keeps the rest.
- **Unknown fields are ignored**, so you can send extras like `battery` for debugging.
- **A line with no known fields, or invalid JSON, is dropped.** The monitor shows the error "The monitor sent data the bridge could not read." on the API until the next good line.
- **Silence means offline.** A monitor that sends nothing for 15 seconds (`staleAfterMs`) shows as offline.

### Minimal firmware (Arduino)

```cpp
void setup() {
  Serial.begin(9600);
}

void loop() {
  float t = readTemperatureC();   // your sensor calls
  float h = readHumidity();
  float pm25 = readPm25();
  float pm10 = readPm10();

  Serial.print("{\"temperature\":"); Serial.print(t, 1);
  Serial.print(",\"humidity\":");    Serial.print(h, 0);
  Serial.print(",\"pm25\":");        Serial.print(pm25, 1);
  Serial.print(",\"pm10\":");        Serial.print(pm10, 0);
  Serial.println("}");               // println adds the newline the bridge splits on

  delay(2000);
}
```

Check the output in any serial monitor at 9600 baud: you should see one JSON object per line and nothing else.

---

## 2. Find the monitor's port

| OS | Typical port | List ports |
| --- | --- | --- |
| macOS | `/dev/tty.usbserial-XXXX` or `/dev/tty.usbmodemXXXX` | `ls /dev/tty.*` |
| Linux | `/dev/ttyUSB0` or `/dev/ttyACM0` | `ls /dev/ttyUSB* /dev/ttyACM*` |
| Windows | `COM3`, `COM4`, … | Device Manager › Ports |

Or ask the bridge, which shows the same list the Monitors page uses:

```bash
curl localhost:3000/api/ports
# [{"path":"/dev/tty.usbserial-1410","manufacturer":"FTDI","inUse":false}]
```

The easy way to tell which port is the monitor: list the ports, plug it in, and list them again.

**Linux:** if opening the port fails with "Permission denied", add your user to the `dialout` group (`sudo usermod -aG dialout $USER`) and log in again.

---

## 3. Connect it

Use whichever of these suits you; they all end up in the same place.

**From the app.** Open **Monitors** and pick the port, name the room, then press **Connect monitor**. Use **Disconnect** on a monitor's row to release it.

**From the API.**

```bash
curl -X POST localhost:3000/api/monitors \
  -H 'Content-Type: application/json' \
  -d '{"portPath": "/dev/tty.usbserial-1410", "name": "Bedroom"}'

curl -X DELETE localhost:3000/api/monitors/bedroom     # disconnect
```

The room name becomes the monitor's id (`Bedroom` → `bedroom`, a second `Bedroom` → `bedroom-2`).

**On start-up.** List the monitors in `bridge/device-config.json` and the bridge connects them every time it starts:

```json
"monitors": [
  { "name": "Bedroom", "portPath": "/dev/tty.usbserial-1410" },
  { "name": "Kitchen", "portPath": "/dev/tty.usbserial-1420" }
]
```

---

## 4. Check it's working

```bash
curl localhost:3000/api/monitors
```

```json
[{
  "id": "bedroom", "name": "Bedroom", "portPath": "/dev/tty.usbserial-1410",
  "online": true, "simulated": false, "error": null,
  "lastSeen": "2026-10-18T20:20:16.697Z",
  "snapshot": { "temperatureC": 21.2, "humidityPct": 43, "pm25": 5.5, "pm10": 15, "takenAt": "2026-10-18T20:20:16.697Z" }
}]
```

- `online: true` and a `snapshot` mean readings are flowing.
- `error` explains a problem, such as unreadable data or a lost connection.
- `curl -N localhost:3000/api/monitors/stream` shows the live feed the app uses.

In the app, the banner at the top of the dashboard tells you where the data comes from:

| Banner | Meaning |
| --- | --- |
| "Sample data. No monitors connected yet." | The bridge isn't running, or has no monitors. The app shows made-up rooms. |
| "Test data from the bridge's mock monitors." | The bridge is in mock mode. |
| No banner | Real monitors. |

---

## 5. Bridge configuration

`bridge/device-config.json`:

| Key | Default | What it does |
| --- | --- | --- |
| `server.port` | `3000` | Bridge HTTP port. The `PORT` environment variable overrides it. |
| `device.baudRate` | `9600` | Serial speed, used for every monitor. |
| `device.staleAfterMs` | `15000` | A monitor that has been quiet this long shows as offline. |
| `device.reconnectAttempts` | `3` | Times to reopen a port that closes unexpectedly (e.g. unplugged). |
| `device.reconnectDelayMs` | `5000` | Wait between reconnect attempts. |
| `device.temperatureUnit` | `"celsius"` | Set to `"fahrenheit"` if the firmware sends °F. The bridge converts it to °C. |
| `monitors` | `[]` | Monitors to connect on start-up (see section 3). |

If you change the port, also change the target in `proxy.conf.json` so the app's dev server still reaches the bridge.

---

## 6. How readings are rated

Each reading has a scale split into zones. The zone a value falls in decides its color, its label and the advice shown. Values below a zone's upper edge belong to it, so CO₂ at exactly 1000 ppm is in the "Stuffy" zone.

| Reading | Good (Clear) | Worth a look (Haze) | Needs attention (Ember) |
| --- | --- | --- | --- |
| PM2.5 | below 9 µg/m³ | 9–35.5 | 35.5 and up |
| PM10 | below 55 µg/m³ | 55–155 | 155 and up |
| CO₂ | below 1000 ppm | 1000–1500 | 1500 and up |
| Temperature | 20–24 °C | below 20 or above 24 | none |
| Humidity | 30–50 % | below 30, or 50–70 | 70 and up |
| Air pressure | 990–1030 hPa | below 990 or above 1030 | none |
| Carbon monoxide | below 9 ppm | none | 9 and up |
| Isoprene | below 1 ppb | 1 and up | none |
| Ethane | below 2 ppb | 2 and up | none |

The particle thresholds follow the US EPA air quality scale as updated in 2024. A room's overall verdict is **Poor** with two or more "needs attention" readings, **Fair** with one, or with two "worth a look", and **Good** otherwise.

---

## 7. Changing or adding a reading

Everything about a reading (name, copy, scale, zones, advice) lives in `src/app/core/metric-definitions.ts`.

**Tune a threshold:** edit the `from` / `to` values of its zones. Keep the zones touching end to end and covering `scale.min` to `scale.max`.

**Add a new reading** (example: PM1.0 sent as `"pm1": 3.4`):

1. **Bridge:** read the field in `parseLine()` in `bridge/server.js`:
   ```js
   pm1: num(raw.pm1),
   ```
2. **App data model:** add it to `SensorSnapshot` in `src/app/core/models.ts`, and add `'pm1'` to `MetricId`:
   ```ts
   /** Ultrafine particles, µg/m³. */
   pm1?: number;
   ```
3. **Definition:** add an entry to `METRIC_DEFINITIONS` in `metric-definitions.ts`. Copy the `pm25` entry and change `id`, labels, copy, `read: (s) => s.pm1` and the zones. Position in the array is the order on the dashboard.
4. **Tests:** add a case to `bridge/server.test.js` for the new field, and run `npm test` and `npm test --prefix bridge`.

Nothing else changes: the dashboard, reading pages, landing page and device illustration all build from the definitions.

---

## 8. Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| Monitors page says to start the bridge | The bridge isn't running, or not on the port in `proxy.conf.json`. Run `npm run bridge`. |
| Port missing from the list | Cable is power-only, a driver is missing (CH340/CP210x boards on macOS/Windows), or another program (Arduino IDE serial monitor) has the port open. Close it and press **Rescan**. |
| "Could not open that port." | Wrong port, no permission (Linux: `dialout`, section 2), or the port is in use. |
| Connected but shows offline | No complete lines arriving: wrong baud rate, missing `\n`, or the firmware isn't printing. Check with a serial monitor at 9600. |
| "The monitor sent data the bridge could not read." | The line isn't valid JSON, values are strings, or no known field names are present (section 1). |
| A reading is missing on the dashboard | The firmware isn't sending that field. Check `snapshot` in `curl localhost:3000/api/monitors`. |
| Temperature looks ~30° off | The firmware sends °F. Set `device.temperatureUnit` to `"fahrenheit"`. |
| Browser console shows `502 Bad Gateway` | The app is running without the bridge. Harmless; it shows sample data. |

---

## 9. Bridge API reference

| Method and path | Body | Returns |
| --- | --- | --- |
| `GET /api/health` | | `{ "ok": true, "mock": false }` |
| `GET /api/ports` | | `[{ path, manufacturer, inUse }]` |
| `GET /api/monitors` | | `[{ id, name, portPath, online, simulated, error, lastSeen, snapshot }]` |
| `GET /api/monitors/stream` | | Server-sent events. Event `monitors` carries the full list on every reading, and at least every 5 seconds. |
| `POST /api/monitors` | `{ "portPath": "...", "name": "Bedroom" }` | `201` with the monitor. `400` if a field is missing, `409` if the port is already connected. |
| `DELETE /api/monitors/:id` | | `204`, or `404` if there's no such monitor. |

For production, run `npm run build` and then `npm run bridge`: the bridge also serves the built app at http://localhost:3000, so one process runs everything.
