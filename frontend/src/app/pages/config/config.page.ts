import { Component, inject, signal } from '@angular/core';
import {
  IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonInput, IonItem, IonList, IonNote,
  IonSpinner, IonText, IonTitle, IonToolbar,
} from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { ApiOk, HealthData } from '../../models/observacion';

@Component({
  selector: 'app-config',
  templateUrl: 'config.page.html',
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput, IonButton, IonNote,
    IonCard, IonCardContent, IonSpinner, IonText,
  ],
})
export class ConfigPage {
  private api = inject(ApiService);

  readonly url = signal(this.api.getBaseUrl());
  readonly testing = signal(false);
  readonly health = signal<HealthData | null>(null);
  readonly error = signal<string | null>(null);
  readonly saved = signal(false);

  onInput(value: string | null | undefined): void {
    this.url.set(value ?? '');
    this.saved.set(false);
  }

  save(): void {
    this.api.setBaseUrl(this.url());
    this.url.set(this.api.getBaseUrl());
    this.saved.set(true);
  }

  async testConnection(): Promise<void> {
    this.save();
    this.testing.set(true);
    this.health.set(null);
    this.error.set(null);
    try {
      const res = await this.api.get<ApiOk<HealthData>>('health.php');
      this.health.set(res.data);
    } catch (e) {
      this.error.set(this.api.explainError(e));
    } finally {
      this.testing.set(false);
    }
  }
}
