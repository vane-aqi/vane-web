import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReadingsStore } from '../core/readings-store';
import { Reveal } from '../motion/reveal';

/** Every monitor, one per room, plus the flow for adding another. */
@Component({
  selector: 'app-monitors',
  imports: [RouterLink, Reveal],
  template: `
    <div class="container page">
      <header class="intro">
        <p class="mono muted" appReveal>Monitors</p>
        <h1 appReveal="lines">Your monitors</h1>
        <p class="lede" appReveal [revealDelay]="0.15">
          One per room. Each reports on its own, and the dashboard brings them together.
        </p>
      </header>

      <ul class="list ruled" appReveal="rule">
        @for (m of store.monitors(); track m.id; let i = $index) {
          <li class="item" appReveal [revealDelay]="0.1 + i * 0.07">
            <div class="name">
              <h2>{{ m.name }}</h2>
              <p class="mono muted">{{ m.online ? (store.isSample ? 'Online · sample data' : 'Online') : 'Not reporting' }}</p>
            </div>
            <span class="bars" aria-hidden="true">
              @for (r of m.readings; track r.id) {
                <i [attr.data-tone]="r.tone"></i>
              } @empty {
                <i class="off"></i>
              }
            </span>
            @if (m.overall; as o) {
              <span class="state" [attr.data-tone]="o.tone">{{ o.label }}</span>
            } @else {
              <span class="state off">Offline</span>
            }
            <a class="text-link" routerLink="/dashboard" [queryParams]="{ room: m.id }" [attr.aria-label]="'Open ' + m.name">Open</a>
          </li>
        }
      </ul>

      <section class="add ruled" appReveal="rule" aria-labelledby="add-heading">
        @if (connecting()) {
          <span class="scan" aria-hidden="true"></span>
        }
        <div class="add-copy">
          <p class="mono muted" appReveal>Add a monitor</p>
          <h2 id="add-heading" appReveal [revealDelay]="0.08">Put one in another room.</h2>
          <p appReveal [revealDelay]="0.16">Power it on nearby, then connect. It joins this list and the dashboard.</p>
          <p class="status" role="status">
            @if (connecting()) {
              Looking for your monitor…
            } @else if (error()) {
              {{ error() }}
            }
          </p>
        </div>
        <button class="btn" type="button" (click)="connect()" [disabled]="connecting()" appReveal [revealDelay]="0.24">
          {{ connecting() ? 'Searching…' : 'Connect a monitor' }}
        </button>
      </section>
    </div>
  `,
  styles: `
    .page {
      display: flex;
      flex-direction: column;
      gap: clamp(36px, 6vh, 64px);
      padding-top: clamp(40px, 7vh, 72px);
    }
    .muted {
      color: var(--muted);
    }
    .intro {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    h1 {
      font-size: clamp(44px, min(7vw, 11vh), 104px);
      font-stretch: 88%;
      line-height: 0.92;
      letter-spacing: -0.05em;
    }
    .lede {
      max-width: 40ch;
      font-size: clamp(17px, 1.5vw, 20px);
      color: var(--ink-2);
    }
    .list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .item {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) 120px auto;
      align-items: center;
      gap: 12px 32px;
      padding-block: 22px;
      border-bottom: 1px solid var(--line);
    }
    .name {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .name h2 {
      font-size: clamp(22px, 2.2vw, 30px);
      font-stretch: 92%;
      letter-spacing: -0.03em;
    }
    .bars {
      display: flex;
      gap: 3px;
      height: 14px;
    }
    .bars i {
      flex: 1;
      background: var(--tone-fill);
    }
    .bars i.off {
      background: repeating-linear-gradient(-45deg, var(--line-strong) 0 1px, transparent 1px 6px);
    }
    .add {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 20px 48px;
      padding-top: 28px;
      overflow: hidden;
    }
    .add-copy {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 46ch;
    }
    .add-copy h2 {
      font-size: clamp(26px, 3vw, 40px);
      letter-spacing: -0.035em;
    }
    .add-copy p {
      color: var(--ink-2);
    }
    .status {
      min-height: 1.5em;
      color: var(--muted) !important;
    }
    /* While searching, a short ember segment runs along the top rule. */
    .scan {
      position: absolute;
      top: 0;
      left: 0;
      width: 22%;
      height: 2px;
      background: var(--signal);
      animation: scan 1.4s cubic-bezier(0.65, 0, 0.35, 1) infinite;
    }
    @keyframes scan {
      from {
        transform: translateX(-100%);
      }
      to {
        transform: translateX(560%);
      }
    }
    @media (max-width: 760px) {
      .item {
        grid-template-columns: minmax(0, 1fr) auto;
      }
      .bars {
        grid-column: 1 / -1;
        grid-row: 2;
      }
      .text-link {
        grid-column: 2;
        grid-row: 1;
      }
      .item .state {
        grid-row: 3;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Monitors {
  protected readonly store = inject(ReadingsStore);
  protected readonly error = signal('');
  protected readonly connecting = signal(false);

  protected async connect(): Promise<void> {
    this.error.set('');
    this.connecting.set(true);
    try {
      await this.store.connect();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Could not connect.');
    } finally {
      this.connecting.set(false);
    }
  }
}
