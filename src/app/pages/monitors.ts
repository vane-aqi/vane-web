import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SerialPortInfo } from '../core/models';
import { ReadingsStore } from '../core/readings-store';
import { Reveal } from '../motion/reveal';

/** Every monitor, one per room, plus the flow for connecting another through the bridge. */
@Component({
  selector: 'app-monitors',
  imports: [ReactiveFormsModule, RouterLink, Reveal],
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
              <p class="mono muted">
                {{ m.online ? ({ sample: 'Online · sample data', mock: 'Online · test monitor', live: 'Online' })[store.dataSource()] : 'Not reporting' }}
              </p>
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
            <span class="actions">
              <a class="text-link" routerLink="/dashboard" [queryParams]="{ room: m.id }" [attr.aria-label]="'Open ' + m.name">Open</a>
              @if (store.dataSource() !== 'sample') {
                <button type="button" class="link-button" (click)="disconnect(m.id, m.name)">Disconnect</button>
              }
            </span>
          </li>
        }
      </ul>

      <section class="add ruled" appReveal="rule" aria-labelledby="add-heading">
        @if (busy()) {
          <span class="scan" aria-hidden="true"></span>
        }
        <div class="add-copy">
          <p class="mono muted" appReveal>Add a monitor</p>
          <h2 id="add-heading" appReveal [revealDelay]="0.08">Put one in another room.</h2>

          @if (store.canConnect()) {
            <p appReveal [revealDelay]="0.16">Plug the monitor into this computer by USB, pick its port and name the room.</p>
          } @else {
            <p appReveal [revealDelay]="0.16">
              Plug the monitor into this computer by USB, then start the Vane bridge from the project folder with
              <code>npm run bridge</code>. This page picks it up automatically.
            </p>
          }
        </div>

        @if (store.canConnect()) {
          <form class="connect" [formGroup]="form" (ngSubmit)="connect()" novalidate appReveal [revealDelay]="0.24">
            <div class="field">
              <label for="port">Port</label>
              <div class="port-row">
                <select id="port" formControlName="portPath">
                  @for (p of ports(); track p.path) {
                    <option [value]="p.path" [disabled]="p.inUse">
                      {{ p.path }}{{ p.manufacturer ? ' · ' + p.manufacturer : '' }}{{ p.inUse ? ' (connected)' : '' }}
                    </option>
                  } @empty {
                    <option value="">No ports found</option>
                  }
                </select>
                <button type="button" class="link-button" (click)="loadPorts()">Rescan</button>
              </div>
            </div>
            <div class="field">
              <label for="room">Room</label>
              <input id="room" formControlName="name" placeholder="Bedroom" autocomplete="off" maxlength="40" />
            </div>
            <button class="btn" type="submit" [disabled]="busy() || form.invalid">
              {{ busy() ? 'Connecting…' : 'Connect monitor' }}
            </button>
          </form>
        }

        <p class="status" role="status">{{ message() }}</p>
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
    .actions {
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .link-button {
      min-height: 36px;
      padding: 0;
      border: 0;
      background: none;
      color: var(--muted);
      font: inherit;
      font-size: 14px;
      text-decoration: underline;
      text-underline-offset: 4px;
      cursor: pointer;
    }
    .link-button:hover {
      color: var(--ink);
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
    code {
      font-family: var(--font-mono);
      font-size: 0.9em;
      padding: 1px 6px;
      border-radius: 4px;
      background: var(--surface);
      border: 1px solid var(--line);
    }
    .connect {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 16px;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    label {
      font-size: 14px;
      font-weight: 600;
    }
    .port-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    select,
    input {
      min-height: 44px;
      min-width: 0;
      padding: 0 12px;
      border: 1px solid var(--line-strong);
      border-radius: 6px;
      background: var(--surface);
      color: var(--ink);
      font: inherit;
      font-size: 15px;
    }
    select {
      max-width: 300px;
    }
    select:focus,
    input:focus {
      outline: none;
      border-color: var(--ink);
    }
    .status {
      flex-basis: 100%;
      min-height: 1.5em;
      color: var(--muted);
    }
    /* While connecting, a short ember segment runs along the top rule. */
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
      .actions {
        grid-column: 2;
        grid-row: 1;
      }
      .item .state {
        grid-row: 3;
      }
      .connect,
      .field,
      select {
        width: 100%;
        max-width: none;
      }
      .port-row {
        width: 100%;
      }
      .port-row select {
        flex: 1;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Monitors {
  protected readonly store = inject(ReadingsStore);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly ports = signal<SerialPortInfo[]>([]);
  protected readonly busy = signal(false);
  protected readonly message = signal('');
  protected readonly form = this.fb.group({
    portPath: ['', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(40)]],
  });

  constructor() {
    // Load the ports as soon as the bridge is reachable (and again if it comes back).
    effect(() => {
      if (this.store.canConnect()) untracked(() => this.loadPorts());
    });
  }

  protected async loadPorts(): Promise<void> {
    try {
      const ports = await this.store.listPorts();
      this.ports.set(ports);
      const free = ports.find((p) => !p.inUse);
      const current = this.form.controls.portPath.value;
      if (!ports.some((p) => p.path === current && !p.inUse)) this.form.controls.portPath.setValue(free?.path ?? '');
    } catch (e) {
      this.message.set(errorText(e));
    }
  }

  protected async connect(): Promise<void> {
    if (this.form.invalid) return;
    const { portPath, name } = this.form.getRawValue();
    this.busy.set(true);
    this.message.set('');
    try {
      await this.store.connect({ portPath, name: name.trim() });
      this.message.set(`${name.trim()} is connected. Readings appear within a few seconds.`);
      this.form.controls.name.reset();
      await this.loadPorts();
    } catch (e) {
      this.message.set(errorText(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected async disconnect(id: string, name: string): Promise<void> {
    try {
      await this.store.disconnect(id);
      this.message.set(`${name} was disconnected.`);
      await this.loadPorts();
    } catch (e) {
      this.message.set(errorText(e));
    }
  }
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong.';
}
