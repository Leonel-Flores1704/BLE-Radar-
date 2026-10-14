/** Fila de la tabla `observaciones` tal como la devuelve observaciones.php. */
export interface Observacion {
  id: number;
  device_id: string;
  nombre: string | null;
  rssi: number | null;
  nota: string;
  creado_en: string;
}

/** Cuerpo del POST a observaciones.php (CONTRATO_API.md). */
export interface NuevaObservacion {
  device_id: string;
  nombre: string | null;
  rssi: number | null;
  nota: string;
}

export interface ApiOk<T> {
  success: true;
  data: T;
}

export interface HealthData {
  php: string;
  mysql: string;
}
