import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.equipofued.bleradar',
  appName: 'BLE Radar',
  webDir: 'www',
  server: {
    // El backend es http:// en la LAN. Con el esquema por defecto (https://localhost)
    // el WebView bloquearía las peticiones por "mixed content".
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;
