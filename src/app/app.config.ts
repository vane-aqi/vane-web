import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { SampleSensorSource } from './core/sample-sensor-source';
import { SensorSource } from './core/sensor-source';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Route params like :id arrive as component inputs. Scrolling is handled by SmoothScroll.
    provideRouter(routes, withComponentInputBinding()),
    // Swap SampleSensorSource for the real device implementation when it's ready.
    { provide: SensorSource, useClass: SampleSensorSource },
  ],
};
