import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonBadge, IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonItem,
  IonLabel, IonList, IonListHeader, IonNote, IonProgressBar, IonText, IonTitle, IonToggle, IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { play, stop } from 'ionicons/icons';
import { BleService } from '../../services/ble.service';
import { ApiService } from '../../services/api.service';
import { DispositivoBle } from '../../models/dispositivo-ble';

@Component({
  selector: 'app-radar',
  templateUrl: 'radar.page.html',
  styleUrls: ['radar.page.scss'],
  imports: [
    RouterLink, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonProgressBar, IonList,
    IonListHeader, IonItem, IonLabel, IonNote, IonBadge, IonToggle, IonCard, IonCardContent, IonText, IonIcon,
  ],
})
export class RadarPage implements OnDestroy {
  readonly ble = inject(BleService);
  readonly api = inject(ApiService);
  private router = inject(Router);

  readonly sortByRssi = signal(true);
  readonly list = computed(() => {
    const devices = this.ble.devices();
    if (!this.sortByRssi()) return devices;
    // RSSI más fuerte primero; los que no reportan RSSI van al final.
    return [...devices].sort((a, b) => (b.rssi ?? -Infinity) - (a.rssi ?? -Infinity));
  });

  constructor() {
    addIcons({ play, stop });
  }

  start(): Promise<void> {
    return this.ble.startScan();
  }

  stop(): Promise<void> {
    return this.ble.stopScan();
  }

  open(device: DispositivoBle): void {
    this.ble.selected.set(device);
    void this.router.navigate(['/tabs/radar/detalle']);
  }

  /** 0..1 para la barra de intensidad (-100 dBm ≈ 0, -30 dBm ≈ 1). */
  strength(rssi: number): number {
    return Math.min(1, Math.max(0, (rssi + 100) / 70));
  }

  strengthColor(rssi: number): string {
    if (rssi >= -60) return 'success';
    if (rssi >= -80) return 'warning';
    return 'danger';
  }

  /** Al entrar se cargan los vinculados (reloj, audífonos…), que no suelen anunciarse mientras están conectados. */
  async ionViewWillEnter(): Promise<void> {
    try {
      await this.ble.ensureReady();
      await this.ble.loadBonded();
    } catch {
      // Sin permisos o Bluetooth apagado: el error se muestra al pulsar «Iniciar».
    }
  }

  // Al salir de la pantalla (incluido ir a Detalle) no se deja el escaneo activo.
  ionViewWillLeave(): void {
    void this.ble.stopScan();
  }

  ngOnDestroy(): void {
    void this.ble.stopScan();
  }
}
