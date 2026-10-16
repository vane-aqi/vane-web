# Vane

An indoor air-quality site and dashboard by Raccoon Inc. Built with Angular 22, GSAP and Lenis.

No monitor is connected yet, so the app runs on sample readings. See [Connecting the real device](#connecting-the-real-device).

## Run it

```bash
npm install
npm start        # http://localhost:4200
npm test         # unit tests (Vitest)
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

Everything flows through one abstract class, `core/sensor-source.ts`:

```ts
abstract class SensorSource {
  monitors: Signal<MonitorFeed[]>; // one per room: { id, name, online, snapshot }
  connection: Signal<'disconnected' | 'connecting' | 'connected'>; // the "add a monitor" flow
  isSample: boolean;
  connect(): Promise<void>;
  disconnect(): void;
}
```

1. Create e.g. `core/device-sensor-source.ts` that extends `SensorSource` and talks to the hardware (HTTP polling, WebSocket, Web Bluetooth, whatever the device supports). Convert each device's payload to a `SensorSnapshot`, wrap it in a `MonitorFeed` with the room name, and `.set()` the list on a signal.
2. In `app.config.ts`, change `useClass: SampleSensorSource` to your new class.

Nothing else needs to change. If the device reports extra values, add them to `SensorSnapshot` and add a definition in `metric-definitions.ts`. Thresholds live there too, so you can tune them after calibrating.

## Placeholders to fill in

- `[YOUR EMAIL]` in `pages/contact/contact.html`
- Room names and sample values in `core/sample-sensor-source.ts`
- The contact form doesn't send anywhere yet (see the `TODO` in `contact.ts`)
