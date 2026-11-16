import { Routes } from '@angular/router';
import { METRIC_DEFINITIONS } from './core/metric-definitions';
import { Landing } from './pages/landing/landing';

export const routes: Routes = [
  { path: '', component: Landing, title: 'Vane – Indoor Air Quality Dashboard' },
  {
    path: 'dashboard',
    // loadComponent splits the page into its own bundle, downloaded on first visit.
    loadComponent: () => import('./pages/overview/overview').then((m) => m.Overview),
    title: 'Dashboard · Vane',
  },
  {
    path: 'readings/:id',
    loadComponent: () => import('./pages/reading-detail/reading-detail').then((m) => m.ReadingDetail),
    title: (route) => {
      const metric = METRIC_DEFINITIONS.find((m) => m.id === route.paramMap.get('id'));
      return `${metric?.label ?? 'Reading'} · Vane`;
    },
  },
  {
    path: 'monitors',
    loadComponent: () => import('./pages/monitors').then((m) => m.Monitors),
    title: 'Monitors · Vane',
  },
  { path: 'device', redirectTo: 'monitors' },
  {
    path: 'shop',
    loadComponent: () => import('./pages/shop').then((m) => m.Shop),
    title: 'Shop · Vane',
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about').then((m) => m.About),
    title: 'About · Vane',
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
    title: 'Contact · Vane',
  },
  {
    path: 'brand',
    loadComponent: () => import('./pages/brand').then((m) => m.Brand),
    title: 'Brand · Vane',
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found').then((m) => m.NotFound),
    title: 'Not found · Vane',
  },
];
