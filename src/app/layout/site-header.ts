import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TemperatureUnit } from '../core/models';
import { Preferences } from '../core/preferences';
import { Theme } from '../core/theme';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  protected readonly prefs = inject(Preferences);
  protected readonly theme = inject(Theme);

  protected readonly units: TemperatureUnit[] = ['F', 'C'];

  /** The new theme spreads out from the middle of the button. */
  protected toggleTheme(event: MouseEvent): void {
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.theme.toggle({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
  }
}
