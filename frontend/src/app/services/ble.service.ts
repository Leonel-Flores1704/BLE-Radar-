import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { BleClient, ScanResult, dataViewToHexString, numberToUUID } from '@capacitor-community/bluetooth-le';
import { DispositivoBle } from '../models/dispositivo-ble';

export type BleErrorKind = 'permission' | 'bluetooth-off' | 'unsupported' | 'other';

/** Error con un mensaje listo para mostrar y el tipo para ofrecer la acción correcta. */
export class BleError extends Error {
  constructor(readonly kind: BleErrorKind, message: string) {
    super(message);
  }
}

const SCAN_TIMEOUT_MS = 30_000;
const BATTERY_SERVICE = numberToUUID(0x180f);
const BATTERY_LEVEL = numberToUUID(0x2a19);
const GENERIC_ACCESS = numberToUUID(0x1800);
const DEVICE_NAME = numberToUUID(0x2a00);

/** Algunos identificadores de compañía (Bluetooth SIG) frecuentes en anuncios sin nombre. */
const COMPANIES: Record<number, string> = {
  0x0006: 'Microsoft',
  0x000a: 'Qualcomm',
  0x004c: 'Apple',
  0x0057: 'Harman (JBL)',
  0x0059: 'Nordic Semiconductor',
  0x005d: 'Realtek',
  0x0075: 'Samsung',
  0x0087: 'Garmin',
  0x009e: 'Bose',
  0x00e0: 'Google',
  0x012d: 'Sony',
  0x0157: 'Huami (Amazfit)',
  0x027d: 'Huawei',
  0x038f: 'Xiaomi',
};

export interface LecturaDispositivo {
  /** Nombre leído de la característica 0x2A00; null si no la expone. */
  nombre: string | null;
  /** Nivel de batería 0..100; null si no expone el servicio 0x180F. */
  bateria: number | null;
}

/**
 * Encapsula BleClient. Los callbacks del plugin corren fuera de Angular,
 * por eso todo el estado visible se expone con signals (la app es zoneless).
 */
@Injectable({ providedIn: 'root' })
export class BleService {
  readonly devices = signal<DispositivoBle[]>([]);
  /** Dispositivos vinculados en Android (reloj, audífonos…); traen nombre aunque no se anuncien. */
  readonly bonded = signal<DispositivoBle[]>([]);
  readonly scanning = signal(false);
  readonly error = signal<BleError | null>(null);
  /** Dispositivo elegido en Radar para la pantalla de Detalle. */
  readonly selected = signal<DispositivoBle | null>(null);
  readonly scanTimeoutSeconds = SCAN_TIMEOUT_MS / 1000;

  private initialized = false;
  private scanTimer: ReturnType<typeof setTimeout> | null = null;
  private found = new Map<string, DispositivoBle>();
  /** Nombres conocidos por deviceId (vinculados o leídos por GATT), para los anuncios que llegan sin nombre. */
  private knownNames = new Map<string, string>();

  /** Pide permisos (initialize) y verifica que el Bluetooth esté encendido. */
  async ensureReady(): Promise<void> {
    if (!this.initialized) {
      try {
        // Se reintenta en cada búsqueda mientras falle, para volver a pedir los permisos.
        await BleClient.initialize({ androidNeverForLocation: true });
        this.initialized = true;
      } catch (e) {
        throw this.toInitError(e);
      }
      try {
        await BleClient.startEnabledNotifications((enabled) => this.onBluetoothStateChange(enabled));
      } catch {
        // Opcional: si la plataforma no lo soporta, se sigue verificando con isEnabled().
      }
    }

    if (await BleClient.isEnabled()) return;

    if (Capacitor.getPlatform() !== 'android') {
      throw new BleError('bluetooth-off', 'El Bluetooth está apagado. Enciéndelo e inténtalo de nuevo.');
    }
    try {
      await BleClient.requestEnable();
    } catch {
      throw new BleError('bluetooth-off',
        'El Bluetooth está apagado y se canceló la solicitud para encenderlo. Enciéndelo para buscar dispositivos.');
    }
    if (!(await BleClient.isEnabled())) {
      throw new BleError('bluetooth-off', 'El Bluetooth sigue apagado. Enciéndelo para buscar dispositivos.');
    }
  }

  /** Lista los dispositivos vinculados en Android. En otras plataformas no hace nada. */
  async loadBonded(): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') return;
    try {
      const list = await BleClient.getBondedDevices();
      for (const d of list) {
        if (d.name) this.knownNames.set(d.deviceId, d.name);
      }
      this.bonded.set(list.map((d) => ({
        deviceId: d.deviceId,
        nombre: d.name?.trim() || null,
        rssi: this.found.get(d.deviceId)?.rssi ?? null,
        vinculado: true,
        visto: this.found.get(d.deviceId)?.visto ?? null,
      })));
    } catch (e) {
      console.warn('getBondedDevices', e);
    }
  }

  async startScan(): Promise<void> {
    if (this.scanning()) return;
    this.error.set(null);
    try {
      await this.ensureReady();
    } catch (e) {
      this.error.set(e instanceof BleError ? e : new BleError('other', this.message(e)));
      return;
    }
    await this.loadBonded();

    // Lista nueva por búsqueda; dentro de la misma búsqueda se deduplica por deviceId.
    this.found.clear();
    this.devices.set([]);
    try {
      await BleClient.requestLEScan({ allowDuplicates: false }, (result) => this.onScanResult(result));
    } catch (e) {
      this.error.set(new BleError('other', `No se pudo iniciar la búsqueda: ${this.message(e)}`));
      return;
    }
    this.scanning.set(true);
    this.scanTimer = setTimeout(() => void this.stopScan(), SCAN_TIMEOUT_MS);
  }

  /** Detiene el escaneo nativo y el temporizador. Es seguro llamarlo aunque no se esté buscando. */
  async stopScan(): Promise<void> {
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
    if (!this.scanning()) return;
    this.scanning.set(false);
    try {
      await BleClient.stopLEScan();
    } catch (e) {
      console.warn('stopLEScan', e);
    }
  }

  /**
   * Se conecta y lee el nombre (0x1800 / 0x2A00) y la batería estándar (0x180F / 0x2A19).
   * Cada dato es null si el periférico no expone esa característica.
   */
  async readDevice(deviceId: string): Promise<LecturaDispositivo> {
    await this.stopScan();
    await this.ensureReady();
    try {
      await BleClient.connect(deviceId, undefined, { timeout: 15_000 });
    } catch (e) {
      throw new BleError('other',
        `No se pudo conectar: ${this.message(e)}. Puede que no acepte conexiones, esté lejos o ya esté conectado a otro teléfono.`);
    }
    try {
      const services = await BleClient.getServices(deviceId);
      const has = (service: string, characteristic: string) =>
        services.some((s) => s.uuid.toLowerCase() === service
          && s.characteristics.some((c) => c.uuid.toLowerCase() === characteristic));

      let nombre: string | null = null;
      if (has(GENERIC_ACCESS, DEVICE_NAME)) {
        try {
          const raw = await BleClient.read(deviceId, GENERIC_ACCESS, DEVICE_NAME, { timeout: 10_000 });
          nombre = new TextDecoder().decode(raw).replace(/\0/g, '').trim() || null;
        } catch (e) {
          console.warn('read device name', e);
        }
      }
      if (nombre) this.rememberName(deviceId, nombre);

      let bateria: number | null = null;
      if (has(BATTERY_SERVICE, BATTERY_LEVEL)) {
        const value = await BleClient.read(deviceId, BATTERY_SERVICE, BATTERY_LEVEL, { timeout: 10_000 });
        bateria = value.getUint8(0);
      }
      return { nombre, bateria };
    } catch (e) {
      throw new BleError('other', `No se pudo leer el dispositivo: ${this.message(e)}`);
    } finally {
      try {
        await BleClient.disconnect(deviceId);
      } catch (e) {
        console.warn('disconnect', e);
      }
    }
  }

  openAppSettings(): Promise<void> {
    return BleClient.openAppSettings();
  }

  openBluetoothSettings(): Promise<void> {
    return BleClient.openBluetoothSettings();
  }

  private onScanResult(result: ScanResult): void {
    const id = result.device.deviceId;
    const previous = this.found.get(id);
    const name = (result.localName || result.device.name || '').trim() || null;
    const device: DispositivoBle = {
      deviceId: id,
      // Si un anuncio posterior llega sin nombre, se conserva el que ya se había recibido
      // o el conocido por vinculación / lectura GATT.
      nombre: name ?? previous?.nombre ?? this.knownNames.get(id) ?? null,
      rssi: typeof result.rssi === 'number' ? result.rssi : null,
      visto: new Date(),
    };
    const companyId = Object.keys(result.manufacturerData ?? {}).map(Number)[0];
    if (companyId !== undefined) {
      device.fabricante = COMPANIES[companyId] ?? `Compañía 0x${companyId.toString(16).padStart(4, '0').toUpperCase()}`;
    }
    if (typeof result.txPower === 'number') {
      device.txPower = result.txPower === 127 ? null : result.txPower;
    }
    const manufacturer = this.hexMap(result.manufacturerData, (k) => `0x${Number(k).toString(16).padStart(4, '0').toUpperCase()}`);
    if (manufacturer) device.manufacturerData = manufacturer;
    const serviceData = this.hexMap(result.serviceData, (k) => k);
    if (serviceData) device.serviceData = serviceData;
    if (result.uuids?.length) device.serviceUuids = result.uuids;

    this.found.set(id, device);
    this.devices.set([...this.found.values()]);
    // Si es un vinculado que sí se está anunciando, se actualiza su RSSI.
    if (this.bonded().some((b) => b.deviceId === id)) {
      this.bonded.update((list) => list.map((b) => (b.deviceId === id ? { ...b, rssi: device.rssi, visto: device.visto } : b)));
    }
  }

  /** Guarda un nombre leído por GATT y lo aplica a las listas y al seleccionado. */
  private rememberName(deviceId: string, nombre: string): void {
    this.knownNames.set(deviceId, nombre);
    const rename = (d: DispositivoBle) => (d.deviceId === deviceId ? { ...d, nombre } : d);
    const prev = this.found.get(deviceId);
    if (prev) this.found.set(deviceId, rename(prev));
    this.devices.update((list) => list.map(rename));
    this.bonded.update((list) => list.map(rename));
    const sel = this.selected();
    if (sel?.deviceId === deviceId) this.selected.set(rename(sel));
  }

  private onBluetoothStateChange(enabled: boolean): void {
    if (!enabled && this.scanning()) {
      void this.stopScan();
      this.error.set(new BleError('bluetooth-off', 'Se apagó el Bluetooth y la búsqueda se detuvo.'));
    }
  }

  private hexMap(data: Record<string, DataView> | undefined, label: (key: string) => string): string | undefined {
    if (!data) return undefined;
    const entries = Object.entries(data);
    if (!entries.length) return undefined;
    return entries.map(([k, v]) => `${label(k)}: ${dataViewToHexString(v)}`).join('\n');
  }

  private toInitError(e: unknown): BleError {
    const msg = this.message(e);
    if (/permission/i.test(msg)) {
      return new BleError('permission',
        'Permisos de Bluetooth denegados. Concede "Dispositivos cercanos" (o "Ubicación" en Android 11 o inferior) desde los ajustes de la app.');
    }
    if (/not (supported|available)|unsupported/i.test(msg)) {
      return new BleError('unsupported', 'Este dispositivo no soporta Bluetooth LE.');
    }
    return new BleError('other', `No se pudo inicializar Bluetooth: ${msg}`);
  }

  private message(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
  }
}
