import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent,
  IonHeader, IonItem, IonLabel, IonList, IonSpinner, IonText, IonTextarea, IonTitle, IonToolbar, ToastController,
} from '@ionic/angular';
import { BleService } from '../../services/ble.service';
import { ApiService } from '../../services/api.service';
import { ApiOk, NuevaObservacion } from '../../models/observacion';

type ReadState =
  | { status: 'idle' }
  | { status: 'reading' }
  | { status: 'ok'; nombre: string | null; bateria: number | null }
  | { status: 'error'; message: string };

export const NOTE_MAX = 255;

@Component({
  selector: 'app-detalle',
  templateUrl: 'detalle.page.html',
  styleUrls: ['detalle.page.scss'],
  imports: [
    DatePipe, RouterLink, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonList, IonItem,
    IonLabel, IonButton, IonTextarea, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSpinner, IonText,
  ],
})
export class DetallePage {
  readonly ble = inject(BleService);
  readonly api = inject(ApiService);
  private toast = inject(ToastController);

  readonly device = this.ble.selected;
  readonly note = signal('');
  readonly saving = signal(false);
  readonly reading = signal<ReadState>({ status: 'idle' });
  readonly noteMax = NOTE_MAX;

  ionViewWillEnter(): void {
    this.reading.set({ status: 'idle' });
  }

  async readDevice(): Promise<void> {
    const d = this.device();
    if (!d) return;
    this.reading.set({ status: 'reading' });
    try {
      const { nombre, bateria } = await this.ble.readDevice(d.deviceId);
      this.reading.set({ status: 'ok', nombre, bateria });
    } catch (e) {
      this.reading.set({ status: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  }

  async save(): Promise<void> {
    const d = this.device();
    if (!d || this.saving()) return;
    const payload: NuevaObservacion = {
      device_id: d.deviceId,
      nombre: d.nombre,
      rssi: d.rssi,
      nota: this.note().trim().slice(0, NOTE_MAX),
    };
    this.saving.set(true);
    try {
      const res = await this.api.postJson<ApiOk<{ id: number }>>('observaciones.php', payload);
      this.note.set('');
      await this.showToast(`Observación guardada (id ${res.data.id}).`, 'success');
    } catch (e) {
      await this.showToast(this.api.explainError(e), 'danger', 6000);
    } finally {
      this.saving.set(false);
    }
  }

  private async showToast(message: string, color: string, duration = 2500): Promise<void> {
    const t = await this.toast.create({ message, color, duration, position: 'bottom' });
    await t.present();
  }
}
