import { ChangeDetectionStrategy, Component, afterNextRender, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Segment } from '../core/models';
import { Theme } from '../core/theme';
import { Flip } from '../motion/flip';
import { Reveal } from '../motion/reveal';
import { Icon } from '../shared/icon';
import { RangeScale } from '../shared/range-scale';

interface Swatch {
  token: string;
  name: string;
  use: string;
  /** For text colors: the background it is checked against, for a contrast ratio. */
  on?: string;
}

interface SwatchGroup {
  title: string;
  note: string;
  swatches: Swatch[];
}

/**
 * The design system behind Vane: mark, color, type, elevation, components and
 * motion. Everything here is rendered with the same tokens and components the
 * app uses, so it can't drift from the product.
 */
@Component({
  selector: 'app-brand',
  imports: [RouterLink, Reveal, Icon, RangeScale, Flip],
  template: `
    <div class="container page">
      <header class="intro">
        <p class="mono muted" appReveal>Brand</p>
        <h1 appReveal="lines">The Vane design system.</h1>
        <p class="lede" appReveal [revealDelay]="0.12">
          A calm, tactile interface for air quality: soft surfaces you can almost press, status colors that read in
          grayscale, and motion that behaves like a physical instrument. Everything on this page is rendered live
          from the same tokens and components as the app.
        </p>
        <nav class="toc" aria-label="On this page" appReveal [revealDelay]="0.18">
          @for (s of sections; track s.id) {
            <a [href]="'#' + s.id" (click)="jump($event, s.id)">{{ s.label }}</a>
          }
        </nav>
      </header>

      <!-- 01 Mark ------------------------------------------------------------>
      <section id="mark" class="block" aria-labelledby="mark-h">
        <div class="block-head" appReveal>
          <p class="mono muted">01</p>
          <h2 id="mark-h">Mark</h2>
          <p>
            A V whose right arm becomes a wind-vane arrow, turning on a pivot dot. It reads as the letter first and the
            instrument second, and holds up from a 16px tab icon to a 1024px avatar.
          </p>
        </div>
        <div class="mark-grid">
          <figure class="mark-hero glass" appReveal>
            <svg viewBox="0 0 32 32" fill="none" aria-label="Vane mark" role="img">
              <path d="M5.5 7.5 13 25l11-17.3" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M27.2 2.6 27.04 9.59 20.96 5.75Z" fill="var(--vane-accent)" />
              <circle cx="13" cy="25" r="2.6" fill="var(--vane-accent)" />
            </svg>
            <figcaption class="mono muted">Mark · ink + spruce accent</figcaption>
          </figure>
          <figure class="mark-card soft" appReveal [revealDelay]="0.06">
            <span class="wordmark">Vane</span>
            <figcaption class="mono muted">Wordmark · Archivo 700, 125% width</figcaption>
          </figure>
          <figure class="mark-card soft" appReveal [revealDelay]="0.12">
            <div class="sizes">
              @for (s of [64, 32, 16]; track s) {
                <span class="size">
                  <img src="favicon.svg" [width]="s" [height]="s" alt="" />
                  <span class="mono muted">{{ s }}</span>
                </span>
              }
            </div>
            <figcaption class="mono muted">App icon · glass tile at every size</figcaption>
          </figure>
        </div>
      </section>

      <!-- 02 Color ----------------------------------------------------------->
      <section id="color" class="block" aria-labelledby="color-h">
        <div class="block-head" appReveal>
          <p class="mono muted">02</p>
          <h2 id="color-h">Color</h2>
          <p>
            Named for what the air looks like: clear sky, haze, ember. Blue against ochre stays distinct for colorblind
            viewers, and each tone also steps in lightness so the bars still read in grayscale. Switch the theme to see
            the night values; contrast ratios update live.
          </p>
        </div>
        @for (g of groups; track g.title) {
          <div class="swatch-group" appReveal>
            <div class="group-head">
              <h3>{{ g.title }}</h3>
              <p class="muted">{{ g.note }}</p>
            </div>
            <ul class="swatches">
              @for (s of g.swatches; track s.token) {
                <li class="swatch soft">
                  <span class="chip" [style.background]="'var(' + s.token + ')'">
                    @if (s.on) {
                      <span class="chip-text" [style.color]="'var(' + s.token + ')'" [style.background]="'var(' + s.on + ')'">Aa</span>
                    }
                  </span>
                  <span class="sw-name">{{ s.name }}</span>
                  <span class="mono muted keep-case">{{ s.token }}</span>
                  <span class="mono hex">{{ values()[s.token] ?? '' }}</span>
                  <span class="sw-use">{{ s.use }}</span>
                  @if (s.on && ratios()[s.token]; as r) {
                    <span class="ratio mono" [class.fail]="r < 4.5">{{ r.toFixed(1) }}:1 · {{ r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : 'Large only' }}</span>
                  }
                </li>
              }
            </ul>
          </div>
        }
      </section>

      <!-- 03 Type ------------------------------------------------------------>
      <section id="type" class="block" aria-labelledby="type-h">
        <div class="block-head" appReveal>
          <p class="mono muted">03</p>
          <h2 id="type-h">Type</h2>
          <p>
            One variable family, Archivo, used along its width axis: condensed for headlines so they sit tight, extended
            for numbers so readings feel like an instrument display. IBM Plex Mono labels units and states.
          </p>
        </div>
        <div class="type-list soft" appReveal>
          <div class="type-row">
            <span class="t-display">Know your air.</span>
            <span class="mono muted keep-case">Display · 600 · 88% width · −0.05em</span>
          </div>
          <div class="type-row">
            <span class="t-number">7.8<span class="mono keep-case">µg/m³</span></span>
            <span class="mono muted keep-case">Reading · 500 · 112% width · −0.03em</span>
          </div>
          <div class="type-row">
            <span class="t-heading">Open a window for ten minutes</span>
            <span class="mono muted keep-case">Heading · 600 · −0.025em</span>
          </div>
          <div class="type-row">
            <span class="t-body">Instead of raw numbers, Vane tells you whether each reading is healthy and what to do when it isn't.</span>
            <span class="mono muted keep-case">Body · 400 · 16/1.5</span>
          </div>
          <div class="type-row">
            <span class="mono">Healthy below 1,000 ppm</span>
            <span class="mono muted keep-case">Label · Plex Mono · 12 · uppercase · 0.06em</span>
          </div>
        </div>
      </section>

      <!-- 04 Elevation ------------------------------------------------------->
      <section id="elevation" class="block" aria-labelledby="elev-h">
        <div class="block-head" appReveal>
          <p class="mono muted">04</p>
          <h2 id="elev-h">Elevation</h2>
          <p>
            Soft UI: surfaces share the page color and are lifted or pressed by a pair of light and dark shadows. Plain
            neumorphism fails low-vision users, so every tile also carries a faint edge, and nothing relies on shadow
            alone to be found.
          </p>
        </div>
        <div class="elev-grid" appReveal>
          @for (e of elevations; track e.token) {
            <figure class="elev">
              <span class="elev-stage">
                <span class="elev-shape" [class.round]="e.round" [style.box-shadow]="'var(' + e.token + ')'"></span>
              </span>
              <figcaption>
                <span class="sw-name">{{ e.name }}</span>
                <span class="mono muted keep-case">{{ e.token }}</span>
                <span class="sw-use">{{ e.use }}</span>
              </figcaption>
            </figure>
          }
          <figure class="elev">
            <button type="button" class="press-demo" [class.on]="pressed()" [attr.aria-pressed]="pressed()" (click)="pressed.set(!pressed())">
              {{ pressed() ? 'On' : 'Off' }}
            </button>
            <figcaption>
              <span class="sw-name">Try it</span>
              <span class="mono muted keep-case">raise → press</span>
              <span class="sw-use">Controls sink when they're on, like a real switch.</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <!-- 05 Components ------------------------------------------------------>
      <section id="components" class="block" aria-labelledby="comp-h">
        <div class="block-head" appReveal>
          <p class="mono muted">05</p>
          <h2 id="comp-h">Components</h2>
          <p>
            The pieces the dashboard is built from. Status is never color alone: every tone pairs a word with a square,
            and the range bar adds a needle you can read without color at all.
          </p>
        </div>
        <div class="comp-grid">
          <div class="comp soft" appReveal>
            <p class="mono muted comp-label">Status</p>
            <div class="states">
              <span class="state" data-tone="good">Good</span>
              <span class="state" data-tone="watch">A bit humid</span>
              <span class="state" data-tone="alert">Needs attention</span>
              <span class="state off">Offline</span>
            </div>
          </div>

          <div class="comp soft" appReveal [revealDelay]="0.06">
            <p class="mono muted comp-label">Range bar</p>
            <span class="track-well soft-inset">
              <app-range-scale [segments]="segments" [markerPct]="marker()" label="Healthy below 1,000 ppm" />
            </span>
            <input
              type="range"
              min="2"
              max="98"
              [value]="marker()"
              (input)="marker.set(+$any($event.target).value)"
              aria-label="Move the needle"
            />
          </div>

          <div class="comp soft" appReveal [revealDelay]="0.12">
            <p class="mono muted comp-label">Flip reading</p>
            <p class="flip-demo"><span class="num" [appFlip]="flipValue()"></span><span class="mono keep-case">ppm</span></p>
            <button type="button" class="chip-btn" (click)="nextReading()">
              New reading <app-icon name="arrow-right" [size]="14" />
            </button>
          </div>

          <a class="comp tile-demo soft" routerLink="/dashboard" appReveal [revealDelay]="0.18" data-tone="good">
            <span class="r-top">
              <span class="r-icon" aria-hidden="true"><app-icon name="co2" [size]="18" /></span>
              <app-icon class="go" name="arrow-right" [size]="16" />
            </span>
            <span class="r-label">Carbon dioxide</span>
            <span class="r-value"><span class="num">670</span><span class="mono keep-case">ppm</span></span>
            <span class="state">Good</span>
            <span class="mono muted comp-note">Reading tile · opens the dashboard</span>
          </a>
        </div>
      </section>

      <!-- 06 Motion ---------------------------------------------------------->
      <section id="motion" class="block" aria-labelledby="motion-h">
        <div class="block-head" appReveal>
          <p class="mono muted">06</p>
          <h2 id="motion-h">Motion</h2>
          <p>
            Motion explains a change rather than decorating it, and everything respects reduced-motion settings.
          </p>
        </div>
        <ul class="motion-list">
          @for (m of motion; track m.title; let i = $index) {
            <li class="glass" appReveal [revealDelay]="i * 0.06">
              <span class="m-num mono muted">{{ m.timing }}</span>
              <h3>{{ m.title }}</h3>
              <p>{{ m.text }}</p>
            </li>
          }
        </ul>
        <div class="toggle-demo soft" appReveal>
          <div class="toggle soft-inset" role="group" aria-label="Detent demo">
            <span class="toggle-thumb" [style.transform]="'translateX(' + toggleIndex() * 100 + '%)'"></span>
            @for (r of ['Living room', 'Bedroom', 'Kitchen']; track r; let i = $index) {
              <button type="button" [class.active]="toggleIndex() === i" (click)="toggleIndex.set(i)">{{ r }}</button>
            }
          </div>
          <p class="muted">The room switcher overshoots and settles, like a toggle clicking into its detent.</p>
        </div>
      </section>

      <footer class="credits soft" appReveal>
        <div>
          <p class="mono muted">Built with</p>
          <p>Angular 22 (signals, zoneless), GSAP, Lenis, three.js and plain CSS custom properties. No UI kit.</p>
        </div>
        <a class="btn" routerLink="/dashboard">See it in the dashboard</a>
      </footer>
    </div>
  `,
  styles: `
    .page {
      display: flex;
      flex-direction: column;
      gap: clamp(56px, 9vh, 104px);
      padding-top: clamp(32px, 6vh, 64px);
    }
    .muted {
      color: var(--muted);
    }

    /* Intro */
    .intro {
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-width: 62ch;
    }
    h1 {
      font-size: clamp(40px, min(6vw, 9vh), 88px);
      font-stretch: 88%;
      line-height: 0.94;
      letter-spacing: -0.05em;
    }
    .lede {
      font-size: clamp(17px, 1.5vw, 20px);
      line-height: 1.55;
      color: var(--ink-2);
    }
    .toc {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    .toc a {
      padding: 8px 14px;
      border-radius: 999px;
      background: var(--paper);
      box-shadow: var(--raise-sm);
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition:
        box-shadow 0.2s ease,
        transform 0.2s ease;
    }
    .toc a:hover {
      transform: translateY(-1px);
    }
    .toc a:active {
      transform: none;
      box-shadow: var(--press);
    }

    /* Section scaffold */
    .block {
      display: flex;
      flex-direction: column;
      gap: 24px;
      scroll-margin-top: 24px;
    }
    .block-head {
      display: grid;
      grid-template-columns: 48px minmax(0, 1fr);
      grid-template-areas:
        'num title'
        'num text';
      gap: 8px 16px;
      max-width: 70ch;
    }
    .block-head .mono {
      grid-area: num;
      padding-top: 10px;
    }
    .block-head h2 {
      grid-area: title;
      font-size: clamp(30px, 3.4vw, 46px);
      font-stretch: 92%;
      letter-spacing: -0.04em;
    }
    .block-head > p:last-child {
      grid-area: text;
      color: var(--ink-2);
    }
    figure {
      margin: 0;
    }
    h3 {
      font-size: 18px;
      letter-spacing: -0.02em;
    }
    .sw-name {
      font-weight: 600;
    }
    .sw-use {
      font-size: 14px;
      color: var(--ink-2);
      line-height: 1.45;
    }

    /* 01 Mark */
    .mark-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
      grid-template-rows: auto auto;
      gap: 20px;
    }
    .mark-hero {
      grid-row: span 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
      min-height: 340px;
      padding: 32px;
      border-radius: 28px;
    }
    .mark-hero svg {
      width: clamp(120px, 16vw, 200px);
      color: var(--ink);
    }
    .mark-card {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
      padding: 24px;
    }
    .wordmark {
      font-size: clamp(48px, 5vw, 72px);
      font-weight: 700;
      font-stretch: 125%;
      letter-spacing: -0.04em;
      line-height: 1;
    }
    .sizes {
      display: flex;
      align-items: flex-end;
      gap: 28px;
    }
    .size {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    /* 02 Color */
    .swatch-group {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .group-head {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 4px 16px;
    }
    .group-head p {
      font-size: 14px;
    }
    .swatches {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 16px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .swatch {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 10px 10px 14px;
      border-radius: 20px;
    }
    .swatch > span:not(.chip) {
      padding-inline: 6px;
    }
    .chip {
      display: grid;
      place-items: end start;
      height: 84px;
      margin-bottom: 8px;
      padding: 10px;
      border-radius: 13px;
      box-shadow: inset 0 0 0 1px var(--line);
    }
    .chip-text {
      padding: 2px 9px;
      border-radius: 7px;
      font-size: 18px;
      font-weight: 600;
    }
    .hex {
      color: var(--ink-2);
      text-transform: none;
    }
    .ratio {
      align-self: flex-start;
      margin: 6px 6px 0;
      padding: 3px 8px !important;
      border-radius: 6px;
      background: var(--good-bg);
      color: var(--good-fg);
      font-size: 11px;
    }
    .ratio.fail {
      background: var(--watch-bg);
      color: var(--watch-fg);
    }

    /* 03 Type */
    .type-list {
      display: flex;
      flex-direction: column;
      padding: 8px clamp(18px, 2.4vw, 32px);
    }
    .type-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: baseline;
      gap: 8px 32px;
      padding-block: 22px;
      border-bottom: 1px solid var(--line);
    }
    .type-row:last-child {
      border-bottom: 0;
    }
    .type-row > .mono.muted {
      text-align: right;
      white-space: nowrap;
    }
    .t-display {
      font-size: clamp(44px, 6vw, 84px);
      font-weight: 600;
      font-stretch: 88%;
      letter-spacing: -0.05em;
      line-height: 0.95;
    }
    .t-number {
      font-size: clamp(40px, 5vw, 64px);
      font-weight: 500;
      font-stretch: 112%;
      letter-spacing: -0.03em;
      line-height: 1;
    }
    .t-number .mono {
      margin-left: 8px;
      font-size: 14px;
      color: var(--muted);
    }
    .t-heading {
      font-size: clamp(22px, 2.2vw, 28px);
      font-weight: 600;
      letter-spacing: -0.025em;
    }
    .t-body {
      max-width: 52ch;
      color: var(--ink-2);
    }

    /* 04 Elevation */
    .elev-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 28px 20px;
    }
    .elev {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .elev figcaption {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    /* Every sample sits in the same box, so the captions line up. */
    .elev-stage {
      display: grid;
      place-items: center;
      aspect-ratio: 1.3;
    }
    .elev-shape,
    .press-demo {
      display: block;
      aspect-ratio: 1.3;
      border-radius: 22px;
      background: var(--paper);
    }
    .elev-shape {
      width: 100%;
    }
    .elev-shape.round {
      width: auto;
      height: 76%;
      aspect-ratio: 1;
      border-radius: 50%;
    }
    .press-demo {
      width: 100%;
      border: 0;
      box-shadow: var(--raise);
      color: var(--muted);
      font: inherit;
      font-family: var(--font-mono);
      font-size: 13px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      cursor: pointer;
      transition:
        box-shadow 0.3s ease,
        color 0.3s ease;
    }
    .press-demo.on {
      box-shadow: var(--press);
      color: var(--vane-accent);
    }

    /* 05 Components */
    .comp-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 20px;
    }
    .comp {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 18px 20px;
    }
    .comp-label {
      margin-bottom: 2px;
    }
    .states {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .track-well {
      display: block;
      padding: 9px 11px;
      box-shadow: var(--press-soft);
    }
    input[type='range'] {
      width: 100%;
      accent-color: var(--ink);
    }
    .flip-demo .num {
      font-size: 44px;
      font-weight: 500;
      font-stretch: 112%;
      letter-spacing: -0.03em;
    }
    .flip-demo .mono {
      margin-left: 6px;
      color: var(--muted);
    }
    .chip-btn {
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 38px;
      padding: 0 14px;
      border: 0;
      border-radius: 999px;
      background: var(--paper);
      box-shadow: var(--raise-sm);
      color: var(--ink);
      font: inherit;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .chip-btn:active {
      box-shadow: var(--press);
    }
    .tile-demo {
      gap: 2px;
      text-decoration: none;
      transition: transform 0.25s ease;
    }
    .tile-demo:hover {
      transform: translateY(-2px);
    }
    .tile-demo:hover .go {
      color: var(--ink);
      transform: translateX(3px);
    }
    .tile-demo:active {
      transform: none;
      box-shadow: var(--press);
    }
    .r-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .r-icon {
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: var(--paper);
      box-shadow: var(--raise-sm);
      color: var(--ink-2);
    }
    .go {
      color: var(--muted);
      transition: transform 0.25s ease;
    }
    .r-label {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--ink-2);
    }
    .r-value .num {
      font-size: 25px;
      font-weight: 500;
      font-stretch: 112%;
      letter-spacing: -0.03em;
    }
    .r-value .mono {
      margin-left: 4px;
      color: var(--muted);
    }
    .comp-note {
      margin-top: auto;
      padding-top: 10px;
      font-size: 10.5px;
    }

    /* 06 Motion */
    .motion-list {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 20px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .motion-list li {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 22px 24px;
      border-radius: 22px;
    }
    .motion-list p {
      color: var(--ink-2);
    }
    .toggle-demo {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px 28px;
      padding: 20px;
    }
    .toggle {
      position: relative;
      display: grid;
      grid-template-columns: repeat(3, 120px);
      padding: 5px;
    }
    .toggle-thumb {
      position: absolute;
      top: 5px;
      bottom: 5px;
      left: 5px;
      width: 120px;
      border-radius: 999px;
      background: var(--paper);
      box-shadow: var(--raise-sm);
      transition: transform 0.55s cubic-bezier(0.34, 1.4, 0.64, 1);
    }
    .toggle button {
      position: relative;
      min-height: 40px;
      border: 0;
      background: none;
      color: var(--muted);
      font: inherit;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: color 0.25s ease;
    }
    .toggle button.active {
      color: var(--ink);
    }

    /* Credits */
    .credits {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px 32px;
      padding: clamp(20px, 2.6vw, 30px);
    }
    .credits div {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-width: 60ch;
    }

    /* Breakpoints */
    @media (max-width: 1000px) {
      .comp-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .elev-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    @media (max-width: 760px) {
      .mark-grid,
      .motion-list {
        grid-template-columns: minmax(0, 1fr);
      }
      .mark-hero {
        grid-row: auto;
        min-height: 240px;
      }
      .type-row {
        grid-template-columns: minmax(0, 1fr);
      }
      .type-row > .mono.muted {
        text-align: left;
        white-space: normal;
      }
      .block-head {
        grid-template-columns: minmax(0, 1fr);
        grid-template-areas:
          'num'
          'title'
          'text';
      }
      .block-head .mono {
        padding-top: 0;
      }
    }
    @media (max-width: 560px) {
      .page {
        gap: 56px;
        padding-top: 28px;
      }
      .swatches {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .swatch {
        padding: 8px 8px 12px;
        border-radius: 18px;
      }
      .swatch > span:not(.chip) {
        padding-inline: 4px;
      }
      .chip {
        height: 52px;
        margin-bottom: 6px;
        padding: 7px;
        border-radius: 11px;
      }
      .chip-text {
        font-size: 14px;
      }
      .sw-name {
        font-size: 15px;
      }
      .sw-use {
        font-size: 13px;
      }
      .swatch .mono {
        font-size: 11px;
      }
      .elev-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .comp-grid {
        grid-template-columns: minmax(0, 1fr);
      }
      .toggle {
        grid-template-columns: repeat(3, 96px);
      }
      .toggle-thumb {
        width: 96px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .toggle-thumb {
        transition: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Brand {
  private readonly theme = inject(Theme);

  protected readonly sections = [
    { id: 'mark', label: 'Mark' },
    { id: 'color', label: 'Color' },
    { id: 'type', label: 'Type' },
    { id: 'elevation', label: 'Elevation' },
    { id: 'components', label: 'Components' },
    { id: 'motion', label: 'Motion' },
  ];

  protected readonly groups: SwatchGroup[] = [
    {
      title: 'Neutrals',
      note: 'Warm, slightly green paper and ink, so the page feels like a surface rather than a screen.',
      swatches: [
        { token: '--paper', name: 'Paper', use: 'Page and tile surface' },
        { token: '--ink', name: 'Ink', use: 'Primary text and the mark', on: '--paper' },
        { token: '--ink-2', name: 'Ink 2', use: 'Body copy', on: '--paper' },
        { token: '--muted', name: 'Muted', use: 'Labels and secondary text', on: '--paper' },
        { token: '--line', name: 'Line', use: 'Dividers and tile edges' },
      ],
    },
    {
      title: 'Status',
      note: 'Clear, haze, ember. Fills for bars, deeper tones for text.',
      swatches: [
        { token: '--good-fill', name: 'Clear', use: 'Good readings' },
        { token: '--good-fg', name: 'Clear text', use: 'Status label', on: '--paper' },
        { token: '--watch-fill', name: 'Haze', use: 'Worth a look' },
        { token: '--watch-fg', name: 'Haze text', use: 'Status label', on: '--paper' },
        { token: '--alert-fill', name: 'Ember', use: 'Needs attention' },
        { token: '--alert-fg', name: 'Ember text', use: 'Status label', on: '--paper' },
      ],
    },
    {
      title: 'Thermal and accent',
      note: 'Temperature gets its own scale, kept apart from the status blues and reds.',
      swatches: [
        { token: '--cold-fill', name: 'Cold', use: 'Below the comfort band' },
        { token: '--comfort-fill', name: 'Comfort', use: 'In the comfort band' },
        { token: '--hot-fill', name: 'Hot', use: 'Above the comfort band' },
        { token: '--vane-accent', name: 'Spruce', use: 'The arrowhead and pivot' },
        { token: '--signal', name: 'Signal', use: 'Focus rings, used sparingly' },
      ],
    },
  ];

  protected readonly elevations = [
    { token: '--raise', name: 'Raise', use: 'Tiles and cards', round: false },
    { token: '--raise-sm', name: 'Raise small', use: 'Buttons, icons, sliders', round: true },
    { token: '--press', name: 'Press', use: 'Pressed and active controls', round: false },
    { token: '--press-soft', name: 'Press soft', use: 'Wells for bars and inputs', round: false },
  ];

  protected readonly motion = [
    {
      timing: '0.4s · power3.out',
      title: 'Rise into place',
      text: 'Tiles lift in one after another, so the eye follows the order the page is read in.',
    },
    {
      timing: '0.55s · back.out(1.4)',
      title: 'Settle like hardware',
      text: 'Toggles overshoot slightly and settle, like a switch clicking into its detent.',
    },
    {
      timing: 'per digit',
      title: 'Numbers flip, never jump',
      text: 'A changed reading flips digit by digit like a split-flap display, so you notice what moved.',
    },
  ];

  /** A CO₂ scale for the range bar demo: good to 1,000, watch to 1,500, alert above. */
  protected readonly segments: Segment[] = [
    { startPct: 0, widthPct: 50, tone: 'good' },
    { startPct: 50, widthPct: 25, tone: 'watch' },
    { startPct: 75, widthPct: 25, tone: 'alert' },
  ];
  protected readonly marker = signal(34);

  private readonly readings = ['670', '842', '1,120', '590', '1,560'];
  private readingIndex = 0;
  protected readonly flipValue = signal(this.readings[0]);
  protected nextReading(): void {
    this.readingIndex = (this.readingIndex + 1) % this.readings.length;
    this.flipValue.set(this.readings[this.readingIndex]);
  }

  protected readonly pressed = signal(false);
  protected readonly toggleIndex = signal(0);

  /** Resolved token values and contrast ratios, read from the live CSS. */
  protected readonly values = signal<Record<string, string>>({});
  protected readonly ratios = signal<Record<string, number>>({});

  constructor() {
    afterNextRender(() => this.readTokens());
    // Re-read after a theme switch, once the new values have been applied.
    effect(() => {
      this.theme.mode();
      untracked(() => requestAnimationFrame(() => requestAnimationFrame(() => this.readTokens())));
    });
  }

  protected jump(event: Event, id: string): void {
    const el = document.getElementById(id);
    if (!el) return;
    event.preventDefault();
    el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  private readTokens(): void {
    const style = getComputedStyle(document.documentElement);
    const values: Record<string, string> = {};
    const ratios: Record<string, number> = {};
    for (const s of this.groups.flatMap((g) => g.swatches)) {
      const v = style.getPropertyValue(s.token).trim();
      values[s.token] = v.toUpperCase();
      if (s.on) {
        const ratio = contrast(v, style.getPropertyValue(s.on).trim());
        if (ratio) ratios[s.token] = ratio;
      }
    }
    this.values.set(values);
    this.ratios.set(ratios);
  }
}

/** WCAG contrast ratio between two #rrggbb colors, or null if either can't be read. */
function contrast(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function luminance(hex: string): number | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
