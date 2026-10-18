# Vane

An indoor air-quality site and dashboard by GB Labs. Built with Angular 22, GSAP and Lenis.

No monitor is connected yet, so the app runs on sample readings. See [Connecting the real device](#connecting-the-real-device).

## Run it

```bash
npm install
npm start        # http://localhost:4200
npm test         # unit tests (Vitest)
npm test --prefix bridge   # bridge tests
npm run build    # production build in dist/
```

The opening animation plays once per browser tab. Open a new tab (or clear session storage) to see it again. It's skipped for anyone with "reduce motion" turned on.

The moon/sun button in the header switches between light and dark themes. The first visit follows the system setting; after that the choice is remembered.

## Pages

| URL | What it is |
| --- | --- |
| `/` | Landing page: hero with a live readout, what each sensor measures, scroll-revealed advice |
| `/dashboard?room=…` | Room switcher, then every reading for that room plus what to do, most urgent first |
| `/readings/:id?room=…` | One reading in depth, sized to fit one screen: gauge, advice, and for gases each gas |
| `/monitors` | Every monitor (one per room) and the flow for adding another |
| `/shop` | Buy a monitor. Currently out of stock, with a "notify me" email form |
| `/about`, `/contact` | About and a contact form with validation |

## Project layout

```
src/
  styles.css                 Design tokens (colors, fonts) and shared classes
  app/
    app.ts                   Shell: intro, header, <router-outlet>, footer
    app.routes.ts            URL → page mapping
    app.config.ts            App-wide providers (router, which SensorSource to use)
    core/                    Data and logic, no UI
      models.ts              Types shared everywhere
      metric-definitions.ts  Copy, scales and thresholds for each reading
      evaluate.ts            Pure helpers: which zone, marker position, overall verdict
      sensor-source.ts       The interface the device must implement
      sample-sensor-source.ts  Fake device used for now
      readings-store.ts      Turns raw numbers into what the screens show
      preferences.ts         °F / °C setting
      theme.ts               Light / dark theme and the circular switch animation
    motion/                  Everything animated
      gsap.ts                Registers GSAP plugins; import gsap from here
      smooth-scroll.ts       Lenis, wired into GSAP's ticker and ScrollTrigger
      intro.ts               The opening sequence
      intro-state.ts         Whether the intro plays, and when it's done
      reveal.ts              The shared entrance animation every page uses (appReveal)
      count-up.ts            Numbers that count up (adapted from React Bits CountUp)
      scroll-words.ts        Words that brighten on scroll (adapted from React Bits ScrollReveal)
    layout/                  Header and footer
    shared/                  Reusable UI: icon, range bar, arc gauge, animated vane, media-query signal
    pages/                   One folder or file per route
```

React Bits only ships React components, so the effects used here are rewritten as Angular components and directives on top of GSAP, which is what React Bits uses underneath.

## Motion, in one place

Every page uses the same entrance vocabulary so the site feels like one thing:

- `appReveal`: content rises and fades in
- `appReveal="lines"`: headings slide up line by line out of a mask (static text only)
- `class="ruled" appReveal="rule"`: a section's top rule draws in from the left
- `appReveal="fade"`: fade only

All of them play once when the element scrolls into view, and none of them run for visitors who prefer reduced motion (`html.motion` is only set in `index.html` when motion is OK).

## Angular in five ideas

If you're new to Angular, these are the pieces this project uses, with where to find them.

1. **Components** are a class plus a template. `@Component({ selector, template, styles })` in any file under `pages/` or `shared/`. Styles in a component only affect that component.
2. **Signals** hold state. `signal()` is a value you can set, `computed()` derives from other signals, and templates update automatically when they change. See `readings-store.ts`.
3. **Inputs** pass data into a component: `segments = input.required<Segment[]>()` in `range-scale.ts`, used as `<app-range-scale [segments]="r.segments" />`.
4. **Dependency injection**: services marked `@Injectable` are created once and shared. Components get them with `inject(ReadingsStore)`.
5. **Template syntax**: `{{ value }}` prints, `[prop]="expr"` binds, `(click)="fn()"` listens, and `@if` / `@for` / `@switch` control what renders.

Two more you'll see in the motion code: `afterNextRender()` runs code once the page is actually on screen (needed before measuring or animating DOM), and `DestroyRef.onDestroy()` cleans up when a page is left. Every GSAP animation is created inside a `gsap.context()` so a single `revert()` removes it.

## Connecting the real device

Step-by-step guide for engineers (firmware format, ports, configuration, thresholds, troubleshooting): [docs/connecting-a-monitor.md](docs/connecting-a-monitor.md).

The monitor plugs in by USB and prints one JSON object per line over serial (9600 baud):

```json
{"temperature": 25.5, "humidity": 60, "pm25": 35, "pm10": 50}
```

Temperature is in °C (change `device.temperatureUnit` in `bridge/device-config.json` if the firmware sends °F). If newer firmware adds `co2`, `pressure`, `co`, `isoprene` or `ethane`, those readings show up automatically. The app only shows what a monitor actually reports.

Browsers can't read serial ports, so a small Node server in `bridge/` reads them and streams readings to the web app.

```
monitor ──USB/serial──▶ bridge (Node, :3000) ──server-sent events──▶ web app
```

**Run it**

```bash
npm install --prefix bridge   # once
npm run bridge                # terminal 1: reads real serial ports
npm start                     # terminal 2: the app; /api is proxied to the bridge
```

Then open **Monitors**, pick the monitor's port, name the room and connect. Add one monitor per room the same way. To connect monitors on start-up instead, list them in `bridge/device-config.json`:

```json
"monitors": [{ "name": "Bedroom", "portPath": "/dev/tty.usbserial-1410" }]
```

**No hardware yet?** `npm run bridge:mock` starts the bridge with two fake monitors on fake ports, so the whole connect flow can be tried. When the bridge isn't running at all, the app shows the sample rooms instead.

**One process for production:** run `npm run build`, then `npm run bridge`. The bridge also serves the built app at http://localhost:3000.

**Bridge API** (also documented at the top of `bridge/server.js`):

| | |
| --- | --- |
| `GET /api/ports` | serial ports on this computer |
| `GET /api/monitors` | every monitor and its latest reading |
| `GET /api/monitors/stream` | the same list, pushed on every change |
| `POST /api/monitors` | connect `{ "portPath": "...", "name": "Bedroom" }` |
| `DELETE /api/monitors/:id` | disconnect |

In the app, `core/bridge-sensor-source.ts` talks to the bridge and `core/sample-sensor-source.ts` makes up data; `app.config.ts` picks which one to use. Thresholds and copy for every reading (including PM2.5 and PM10, based on the US EPA's 2024 air quality scale) live in `core/metric-definitions.ts`.

## Placeholders to fill in

- Room names and sample values in `core/sample-sensor-source.ts`
- The contact form doesn't send anywhere yet (see the `TODO` in `contact.ts`)
- `[SHIPPING DETAILS]` on the Shop page (`pages/shop.ts`), and its restock email form doesn't send anywhere yet
