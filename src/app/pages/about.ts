import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reveal } from '../motion/reveal';
import { Vane } from '../shared/vane';

@Component({
  selector: 'app-about',
  imports: [RouterLink, Reveal, Vane],
  template: `
    <div class="container page">
      <div class="top">
        <div class="copy">
          <p class="mono muted" appReveal>About</p>
          <h1 appReveal="lines">Named after the instrument that reads the air.</h1>
        </div>
        <app-vane class="vane" />
      </div>

      <dl class="definition ruled" appReveal="rule">
        <dt appReveal>vane <span class="mono muted">/veɪn/ · noun</span></dt>
        <dd appReveal [revealDelay]="0.1">
          A blade on a rooftop that turns to show which way the wind is blowing. You glance at it, and you know.
        </dd>
      </dl>

      <div class="story">
        <p appReveal>
          Vane pairs with small indoor monitors, one per room, that measure carbon dioxide, temperature, humidity, air
          pressure and three combustion gases. Instead of raw numbers, it tells you whether each reading is healthy and
          what to do when it isn't.
        </p>
        <p class="muted" appReveal [revealDelay]="0.1">Built by Raccoon Inc.</p>
      </div>

      <section class="principles" aria-labelledby="principles-heading">
        <h2 id="principles-heading" class="mono muted" appReveal>What guides it</h2>
        <ul class="ruled" appReveal="rule">
          <li appReveal>
            <h3>Plain words over numbers</h3>
            <p>Every value comes with what it means and what to do about it.</p>
          </li>
          <li appReveal [revealDelay]="0.08">
            <h3>One scale everywhere</h3>
            <p>Clear, haze and ember mean the same thing for every reading in every room.</p>
          </li>
          <li appReveal [revealDelay]="0.16">
            <h3>The urgent thing first</h3>
            <p>Advice is sorted by how soon it matters, so you never have to hunt for it.</p>
          </li>
        </ul>
      </section>

      <a class="btn" routerLink="/dashboard" appReveal>Open the dashboard</a>
    </div>
  `,
  styles: `
    .page {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: clamp(40px, 7vh, 72px);
      padding-top: clamp(40px, 7vh, 72px);
    }
    .muted {
      color: var(--muted);
    }
    .top {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 32px 64px;
      width: 100%;
    }
    .copy {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    h1 {
      max-width: 14ch;
      font-size: clamp(44px, min(7vw, 11vh), 104px);
      font-stretch: 88%;
      line-height: 0.92;
      letter-spacing: -0.05em;
    }
    .vane {
      width: clamp(120px, min(15vw, 26vh), 230px);
      margin-right: clamp(0px, 4vw, 64px);
    }
    .definition {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
      gap: 12px 48px;
      width: 100%;
      margin: 0;
      padding-top: 24px;
    }
    .definition dt {
      font-size: clamp(30px, 3.4vw, 44px);
      font-weight: 600;
      font-style: normal;
      letter-spacing: -0.03em;
    }
    .definition dt .mono {
      display: block;
      margin-top: 6px;
    }
    .definition dd {
      margin: 0;
      font-size: clamp(20px, 2vw, 28px);
      line-height: 1.3;
      letter-spacing: -0.015em;
    }
    .story {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 58ch;
      margin-left: auto;
      font-size: clamp(17px, 1.4vw, 19px);
      color: var(--ink-2);
    }
    .principles {
      width: 100%;
    }
    .principles h2 {
      margin-bottom: 12px;
    }
    .principles ul {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 24px 40px;
      margin: 0;
      padding: 24px 0 0;
      list-style: none;
    }
    .principles h3 {
      font-size: clamp(20px, 1.8vw, 24px);
      letter-spacing: -0.02em;
    }
    .principles p {
      margin-top: 8px;
      color: var(--ink-2);
    }
    @media (max-width: 760px) {
      .definition,
      .principles ul {
        grid-template-columns: minmax(0, 1fr);
      }
    }
    /* Phones: vane tucks in right beside the headline, and everything steps down a size. */
    @media (max-width: 480px) {
      .page {
        gap: 36px;
        padding-top: 32px;
      }
      .top {
        grid-template-columns: minmax(0, 1fr) 92px;
        align-items: end;
        gap: 12px;
      }
      h1 {
        font-size: 36px;
      }
      .vane {
        width: 92px;
        margin: 0;
      }
      .definition {
        padding-top: 18px;
      }
      .definition dt {
        font-size: 28px;
      }
      .definition dd {
        font-size: 19px;
      }
      .story {
        gap: 12px;
        font-size: 16px;
      }
      .principles ul {
        gap: 20px;
        padding-top: 18px;
      }
      .principles h3 {
        font-size: 19px;
      }
      .principles p {
        font-size: 15px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {}
