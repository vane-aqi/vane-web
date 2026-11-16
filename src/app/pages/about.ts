import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reveal } from '../motion/reveal';
import { IconName } from '../core/models';
import { Icon } from '../shared/icon';
import { Vane } from '../shared/vane';

@Component({
  selector: 'app-about',
  imports: [RouterLink, Icon, Reveal, Vane],
  template: `
    <div class="container page">
      <section class="intro" aria-labelledby="about-heading">
        <div class="head">
          <p class="mono muted" appReveal>About</p>
          <h1 id="about-heading" appReveal="lines">Named after the instrument that reads the air.</h1>
        </div>
        <div class="body">
          <p class="lede" appReveal [revealDelay]="0.12">
            Vane pairs with small indoor monitors, one per room, that measure particles, carbon dioxide, temperature,
            humidity and more. Instead of raw numbers, it tells you whether each reading is healthy and what to do when
            it isn't.
          </p>
          <p class="muted credit" appReveal [revealDelay]="0.18">Built by GB Labs.</p>
          <div class="actions" appReveal [revealDelay]="0.24">
            <a class="btn" routerLink="/dashboard">Open the dashboard</a>
            <a class="text-link" routerLink="/contact">Contact us</a>
          </div>
        </div>
        <app-vane class="vane" />
      </section>

      <dl class="definition glass" appReveal>
        <dt>vane <span class="mono muted">/veɪn/ · noun</span></dt>
        <dd>A blade on a rooftop that turns to show which way the wind is blowing. You glance at it, and you know.</dd>
      </dl>

      <section class="principles" aria-labelledby="principles-heading">
        <h2 id="principles-heading" class="mono muted" appReveal>What guides it</h2>
        <ul>
          @for (p of principles; track p.title; let i = $index) {
            <li class="glass" appReveal [revealDelay]="i * 0.08">
              <span class="p-icon" aria-hidden="true"><app-icon [name]="p.icon" [size]="20" /></span>
              <h3>{{ p.title }}</h3>
              <p>{{ p.text }}</p>
            </li>
          }
        </ul>
      </section>
    </div>
  `,
  styles: `
    .page {
      display: flex;
      flex-direction: column;
      gap: clamp(32px, 5.5vh, 56px);
      padding-top: clamp(32px, 6vh, 64px);
    }
    .muted {
      color: var(--muted);
    }

    /* Intro: headline, what Vane does and the next step, all on one left edge;
       the vane stands beside it. */
    .intro {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        'head vane'
        'body vane';
      align-items: center;
      gap: 20px clamp(32px, 6vw, 96px);
    }
    .head {
      grid-area: head;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    h1 {
      max-width: 15ch;
      font-size: clamp(40px, min(6vw, 9vh), 88px);
      font-stretch: 88%;
      line-height: 0.94;
      letter-spacing: -0.05em;
    }
    .body {
      grid-area: body;
      align-self: start;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 60ch;
    }
    .lede {
      font-size: clamp(17px, 1.5vw, 20px);
      line-height: 1.55;
      color: var(--ink-2);
    }
    .credit {
      font-size: 15px;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px 28px;
      margin-top: 8px;
    }
    .vane {
      grid-area: vane;
      width: clamp(120px, min(15vw, 26vh), 220px);
      margin-right: clamp(0px, 3vw, 48px);
    }

    /* The glass feature: the definition as a frosted card. */
    .definition {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
      align-items: center;
      gap: 12px 48px;
      margin: 0;
      padding: clamp(22px, 3vw, 36px) clamp(24px, 3.4vw, 44px);
    }
    .definition dt {
      font-size: clamp(30px, 3.2vw, 42px);
      font-weight: 600;
      letter-spacing: -0.03em;
    }
    .definition dt .mono {
      display: block;
      margin-top: 6px;
    }
    .definition dd {
      margin: 0;
      font-size: clamp(19px, 1.9vw, 26px);
      line-height: 1.3;
      letter-spacing: -0.015em;
    }

    /* Principles: three matching cards that scan as a set. */
    .principles h2 {
      margin: 0 0 14px 4px;
    }
    .principles ul {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 20px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .principles li {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 22px 24px;
      border-radius: 22px;
    }
    .p-icon {
      display: grid;
      place-items: center;
      width: 38px;
      height: 38px;
      margin-bottom: 6px;
      border-radius: 50%;
      background: var(--paper);
      box-shadow: var(--raise-sm);
      color: var(--ink-2);
    }
    .principles h3 {
      font-size: clamp(19px, 1.6vw, 22px);
      letter-spacing: -0.02em;
    }
    .principles p {
      color: var(--ink-2);
      line-height: 1.5;
    }

    @media (max-width: 860px) {
      .principles ul {
        grid-template-columns: minmax(0, 1fr);
        gap: 14px;
      }
      .definition {
        grid-template-columns: minmax(0, 1fr);
      }
    }

    /* Phones: the vane tucks in beside the headline; the text runs full width below. */
    @media (max-width: 600px) {
      .page {
        gap: 32px;
        padding-top: 28px;
      }
      .intro {
        grid-template-columns: minmax(0, 1fr) 84px;
        grid-template-areas:
          'head vane'
          'body body';
        align-items: end;
        gap: 18px 12px;
      }
      h1 {
        font-size: 36px;
      }
      .vane {
        width: 84px;
        margin: 0;
      }
      .lede {
        font-size: 16px;
      }
      .definition dt {
        font-size: 28px;
      }
      .definition dd {
        font-size: 18px;
      }
      .principles li {
        padding: 18px 20px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {
  protected readonly principles: { icon: IconName; title: string; text: string }[] = [
    { icon: 'bulb', title: 'Plain words over numbers', text: 'Every value comes with what it means and what to do about it.' },
    { icon: 'pressure', title: 'One scale everywhere', text: 'Clear, haze and ember mean the same thing for every reading in every room.' },
    { icon: 'check', title: 'The urgent thing first', text: 'Advice is sorted by how soon it matters, so you never have to hunt for it.' },
  ];
}
