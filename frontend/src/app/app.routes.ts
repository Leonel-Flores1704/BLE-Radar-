import { Routes } from '@angular/router';
import { TabsPage } from './tabs/tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'radar',
        loadComponent: () => import('./pages/radar/radar.page').then((m) => m.RadarPage),
      },
      {
        path: 'radar/detalle',
        loadComponent: () => import('./pages/detalle/detalle.page').then((m) => m.DetallePage),
      },
      {
        path: 'historial',
        loadComponent: () => import('./pages/historial/historial.page').then((m) => m.HistorialPage),
      },
      {
        path: 'config',
        loadComponent: () => import('./pages/config/config.page').then((m) => m.ConfigPage),
      },
      { path: '', redirectTo: 'radar', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'tabs/radar', pathMatch: 'full' },
  { path: '**', redirectTo: 'tabs/radar' },
];
