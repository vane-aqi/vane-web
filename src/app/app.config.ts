import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { BridgeSensorSource } from './core/bridge-sensor-source';
import { SensorSource } from './core/sensor-source';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Route params like :id arrive as component inputs. Scrolling is handled by SmoothScroll.
    provideRouter(routes, withComponentInputBinding()),
    // Real monitors through the bridge (bridge/), falling back to sample rooms when it isn't running.
    // Use SampleSensorSource here instead to always show made-up data.
    { provide: SensorSource, useClass: BridgeSensorSource },
  ],
};
