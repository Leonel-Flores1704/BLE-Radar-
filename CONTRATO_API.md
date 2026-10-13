# Contrato REST — BLE Radar

**Base URL configurable:** `http://IP_LAPTOP:80/RUTA_DEL_PROYECTO/api/` — el celular NO usa `localhost` para acceder a la laptop.

Todas las respuestas serán JSON excepto los archivos servidos desde carpeta de uploads. Éxito: `{"success":true,"data":...}`; error: `{"success":false,"error":"mensaje para usuario"}` y HTTP 4xx/5xx apropiado.

| Método | Ruta | Contrato |
|---|---|---|
| GET | `api/health.php` | Retorna estado de PHP + MySQL. |
| GET | `api/observaciones.php` | Lista observaciones BLE. |
| POST | `api/observaciones.php` | JSON: device_id, nombre, rssi, nota. Retorna id. |

## Base de datos
Columnas principales: `id, device_id, nombre, rssi, nota, creado_en`. Archivo disponible: `schema.sql`.

## Reglas de integración
- `GET health` responde 200 si PHP y MySQL están disponibles; responde 503 si la BD falla.
- Los GET deben devolver listas/objetos leídos realmente de MySQL.
- Los POST validan datos en PHP, usan PDO y sentencias preparadas; un archivo no debe sobrescribir otro.
- Axios debe consumir la IP LAN real; mostrar método, URL, estado HTTP y error legible cuando falle.
- En subidas usar `FormData`; limitar tamaño a 8 MB (fotos/audios) y restringir MIME y extensión.
- Validar errores de permisos y cancelación nativa antes de llamar a PHP.

## Privacidad BLE
No asociar identificadores BLE con identidades personales. Los IDs pueden rotar y el RSSI puede no estar disponible; guardar valores `null` cuando corresponda.
