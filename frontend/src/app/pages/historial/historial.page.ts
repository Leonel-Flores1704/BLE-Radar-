import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonItem, IonLabel, IonList, IonNote, IonRefresher,
  IonRefresherContent, IonSpinner, IonText, IonTitle, IonToolbar, RefresherCustomEvent,
} from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { ApiOk, Observacion } from '../../models/observacion';

@Component({
  selector: 'app-historial',
  templateUrl: 'historial.page.html',
  imports: [
    RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent, IonList, IonItem,
    IonLabel, IonNote, IonCard, IonCardContent, IonButton, IonSpinner, IonText,
  ],
})
export class HistorialPage {
  readonly api = inject(ApiService);

  readonly items = signal<Observacion[]>([]);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);

  private readonly dateFormat = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'medium' });

  ionViewWillEnter(): void {
    void this.load();
  }

  async refresh(event: RefresherCustomEvent): Promise<void> {
    await this.load();
    await event.target.complete();
  }

  async load(): Promise<void> {
    if (!this.api.getBaseUrl()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await this.api.get<ApiOk<Observacion[]>>('observaciones.php');
      this.items.set(res.data);
      this.loaded.set(true);
    } catch (e) {
      this.error.set(this.api.explainError(e));
    } finally {
      this.loading.set(false);
    }
  }

  /** creado_en llega como "YYYY-MM-DD HH:mm:ss" (hora del servidor MySQL). */
  formatDate(value: string): string {
    const date = new Date(value.replace(' ', 'T'));
    return isNaN(date.getTime()) ? value : this.dateFormat.format(date);
  }
}
