import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reveal } from '../motion/reveal';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, Reveal],
  template: `
    <div class="container page">
      <h1 appReveal="lines">This page drifted off.</h1>
      <p appReveal [revealDelay]="0.15">The link may be old or mistyped.</p>
      <a class="btn" routerLink="/" appReveal [revealDelay]="0.25">Back to the start</a>
    </div>
  `,
  styles: `
    .page {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
      padding-top: 72px;
    }
    h1 {
      font-size: clamp(44px, 7vw, 96px);
      font-stretch: 88%;
      line-height: 0.92;
      letter-spacing: -0.05em;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {}
