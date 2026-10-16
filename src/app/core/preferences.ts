import { Injectable, effect, signal } from '@angular/core';
import { TemperatureUnit } from './models';

const STORAGE_KEY = 'vane.temperatureUnit';

/** Per-browser display settings, remembered in localStorage. */
@Injectable({ providedIn: 'root' })
export class Preferences {
  readonly temperatureUnit = signal<TemperatureUnit>(loadUnit());

  constructor() {
    // An effect re-runs whenever a signal it reads changes.
    effect(() => {
      const unit = this.temperatureUnit();
      try {
        localStorage.setItem(STORAGE_KEY, unit);
      } catch {
        // Storage can be unavailable (private mode); the setting just won't stick.
      }
    });
  }
}

function loadUnit(): TemperatureUnit {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'C' ? 'C' : 'F';
  } catch {
    return 'F';
  }
}
