import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Reveal } from '../motion/reveal';
import { DeviceRender } from '../shared/device-render';

/** Buy a monitor. Out of stock for now, so it collects emails for a restock notice. */
@Component({
  selector: 'app-shop',
  imports: [ReactiveFormsModule, DeviceRender, Reveal],
  template: `
    <div class="container page ambient">
      <div class="art glass" appReveal="fade">
        <app-device-render class="device" />
      </div>

      <div class="info">
        <p class="mono muted" appReveal>Shop</p>
        <h1 appReveal="lines">Vane Monitor</h1>
        <p class="lede" appReveal [revealDelay]="0.12">
          One per room. Measures fine and coarse particles, carbon dioxide, temperature, humidity and more, and reports
          to your Vane dashboard.
        </p>

        <div class="buy glass" appReveal [revealDelay]="0.08">
          <div class="price-row" appReveal [revealDelay]="0.1">
            <span class="price">$150</span>
            <span class="state off">Out of stock</span>
          </div>
          <button class="btn" type="button" disabled appReveal [revealDelay]="0.18">Out of stock</button>

          <form class="notify" [formGroup]="form" (ngSubmit)="notify()" novalidate appReveal [revealDelay]="0.26">
            @if (subscribed()) {
              <p class="done" role="status">Thanks. We'll email you as soon as it's back.</p>
            } @else {
              <label for="notify-email">Get an email when it's back in stock</label>
              <div class="notify-row">
                <input
                  id="notify-email"
                  type="email"
                  autocomplete="email"
                  placeholder="you@example.com"
                  formControlName="email"
                  [attr.aria-invalid]="showError()"
                />
                <button class="btn ghost" type="submit">Notify me</button>
              </div>
              @if (showError()) {
                <p class="error">Please enter a valid email address.</p>
              }
            }
          </form>
        </div>

        <dl class="facts ruled" appReveal="rule">
          <div appReveal [revealDelay]="0.1">
            <dt class="mono">Measures</dt>
            <dd>PM2.5, PM10, CO₂, temperature, humidity, air pressure, carbon monoxide, isoprene and ethane</dd>
          </div>
          <div appReveal [revealDelay]="0.16">
            <dt class="mono">Works with</dt>
            <dd>The Vane dashboard. Add one per room and read them all in one place.</dd>
          </div>
          <div appReveal [revealDelay]="0.22">
            <dt class="mono">Shipping</dt>
            <dd>[SHIPPING DETAILS]</dd>
          </div>
        </dl>
      </div>
    </div>
  `,
  styles: `
    .page {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
      align-items: start;
      gap: 32px clamp(36px, 5vw, 80px);
      padding-top: clamp(24px, 4vh, 48px);
    }
    .muted {
      color: var(--muted);
    }
    /* The product shot stand-in: a drawn monitor on a quiet surface. */
    .art {
      position: relative;
      display: grid;
      place-items: center;
      aspect-ratio: 1 / 1;
      overflow: hidden;
    }
    /* A pool of light behind the device, like a studio product shot. */
    .art::before {
      content: '';
      position: absolute;
      inset: 18%;
      background:
        radial-gradient(closest-side, color-mix(in srgb, var(--good-fill) 55%, transparent), transparent),
        radial-gradient(60% 50% at 70% 75%, color-mix(in srgb, var(--comfort-fill) 55%, transparent), transparent);
      filter: blur(30px);
      pointer-events: none;
    }
    .art > * {
      position: relative;
    }
    .device {
      width: min(64%, 340px);
    }
    .info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    h1 {
      font-size: clamp(40px, min(5.4vw, 8.5vh), 84px);
      font-stretch: 88%;
      line-height: 0.92;
      letter-spacing: -0.05em;
    }
    .lede {
      max-width: 42ch;
      font-size: clamp(16px, 1.4vw, 19px);
      color: var(--ink-2);
    }
    .buy {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 14px;
      margin-top: 4px;
      padding: 20px 22px;
    }
    .price-row {
      display: flex;
      align-items: baseline;
      gap: 20px;
    }
    .price {
      font-size: clamp(28px, 2.6vw, 36px);
      font-weight: 500;
      font-stretch: 112%;
      letter-spacing: -0.03em;
    }
    .notify {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      max-width: 460px;
    }
    label {
      font-size: 14px;
      font-weight: 600;
    }
    .notify-row {
      display: flex;
      gap: 8px;
    }
    input {
      flex: 1;
      min-width: 0;
      min-height: 44px;
      padding: 0 14px;
      border: 1px solid var(--line-strong);
      border-radius: 12px;
      background: color-mix(in srgb, var(--surface) 70%, transparent);
      color: var(--ink);
      font: inherit;
      font-size: 16px;
    }
    input:focus {
      outline: none;
      border-color: var(--ink);
    }
    [aria-invalid='true'] {
      border-color: var(--alert-fg);
    }
    .ghost {
      background: transparent;
      color: var(--ink);
      box-shadow: inset 0 0 0 1px var(--ink);
    }
    .ghost:hover {
      background: var(--ink);
      color: var(--paper);
    }
    .error {
      font-size: 14px;
      color: var(--alert-fg);
    }
    .done {
      color: var(--ink-2);
    }
    .facts {
      display: flex;
      flex-direction: column;
      margin: 12px 0 0;
    }
    .facts div {
      display: grid;
      grid-template-columns: 120px minmax(0, 1fr);
      gap: 4px 24px;
      padding-block: 11px;
      border-bottom: 1px solid var(--line);
    }
    .facts dt {
      padding-top: 3px;
      color: var(--muted);
    }
    .facts dd {
      margin: 0;
      color: var(--ink-2);
    }
    @media (max-width: 860px) {
      .page {
        grid-template-columns: minmax(0, 1fr);
      }
      .art {
        aspect-ratio: auto;
        padding: 36px 0 24px;
      }
      .device {
        width: min(52%, 220px);
      }
    }
    @media (max-width: 480px) {
      .page {
        gap: 28px;
      }
      h1 {
        font-size: 40px;
      }
      .notify-row {
        flex-direction: column;
      }
      .facts div {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shop {
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly subscribed = signal(false);
  protected readonly form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });

  protected showError(): boolean {
    const email = this.form.controls.email;
    return email.invalid && email.touched;
  }

  protected notify(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // TODO: send this.form.getRawValue().email to a mailing list or backend.
    this.subscribed.set(true);
  }
}
