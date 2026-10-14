import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { bluetooth, settings, time } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="radar">
          <ion-icon name="bluetooth"></ion-icon>
          <ion-label>Radar</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="historial">
          <ion-icon name="time"></ion-icon>
          <ion-label>Historial</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="config">
          <ion-icon name="settings"></ion-icon>
          <ion-label>Config</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  constructor() {
    addIcons({ bluetooth, time, settings });
  }
}
