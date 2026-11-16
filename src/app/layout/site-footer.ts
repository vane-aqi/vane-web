import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <footer>
      <div class="container row">
        <span class="left">
          <span>© 2025 GB Labs</span>
          <a routerLink="/brand" routerLinkActive="active" ariaCurrentWhenActive="page">Brand</a>
        </span>
        <span>Know your air, breathe easier. Vane is for everyday awareness, not medical advice.</span>
      </div>
    </footer>
  `,
  styles: `
    footer {
      border-top: 1px solid var(--line);
      margin-top: 64px;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 8px 24px;
      padding-block: 24px;
      font-size: 14px;
      color: var(--muted);
    }
    .left {
      display: inline-flex;
      gap: 20px;
    }
    a {
      color: var(--ink-2);
      font-weight: 600;
      text-decoration: none;
      transition: color 0.2s ease;
    }
    a:hover,
    a.active {
      color: var(--ink);
      text-decoration: underline;
      text-underline-offset: 4px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {}
