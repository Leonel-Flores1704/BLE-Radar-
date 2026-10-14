/** Datos de un anuncio BLE tal como llegan del plugin; nada se inventa. */
export interface DispositivoBle {
  deviceId: string;
  /** null cuando el anuncio no trae nombre (se muestra "Sin nombre"). */
  nombre: string | null;
  /** null cuando el sistema no reporta RSSI (se muestra "RSSI no disponible"). */
  rssi: number | null;
  /** Potencia de transmisión en dBm; null si el anuncio la reporta como no disponible (127). */
  txPower?: number | null;
  /** Datos de fabricante en hexadecimal, por identificador de compañía. */
  manufacturerData?: string;
  /** Datos de servicio en hexadecimal, por UUID de servicio. */
  serviceData?: string;
  serviceUuids?: string[];
  /** Fabricante según el identificador de compañía del anuncio (si se conoce). */
  fabricante?: string;
  /** true si viene de la lista de dispositivos vinculados de Android, no de un anuncio. */
  vinculado?: boolean;
  /** null si el dispositivo vinculado no se ha visto en el escaneo actual. */
  visto: Date | null;
}
