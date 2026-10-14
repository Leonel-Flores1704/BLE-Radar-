# BLE Radar · Reto 03

App Ionic + Angular (standalone, zoneless) con Capacitor que escanea anuncios **Bluetooth LE** con
`@capacitor-community/bluetooth-le`, muestra los datos que publican los dispositivos y registra observaciones
en un backend **PHP + MySQL** consumido con **Axios** por la red local.

| Pantalla | Qué hace |
|---|---|
| **Radar** | Iniciar / detener búsqueda (se detiene sola a los 30 s), lista sin duplicados, nombre o "Sin nombre", deviceId, RSSI con barra de intensidad, ordenar por RSSI. |
| **Detalle** | Todos los datos del anuncio que realmente llegaron, "Leer batería" (servicio 0x180F, si existe) y nota → `POST observaciones.php`. |
| **Historial** | `GET observaciones.php` con fecha, nombre o device_id, RSSI y nota. Desliza hacia abajo para refrescar. |
| **Config** | URL base de la API y botón "Probar conexión" (`health.php`). |

## Estructura

```
backend/            PHP (copiar dentro de htdocs)
  api/health.php        GET  estado de PHP + MySQL (200 / 503)
  api/observaciones.php GET lista · POST registra (201 / 400 / 405 / 500)
  config.example.php    plantilla de conexión → config.php (no se versiona)
frontend/           Ionic + Angular + Capacitor (Android)
  src/app/services/api.service.ts   Axios (starter del docente + método HTTP en los errores)
  src/app/services/ble.service.ts   BleClient: permisos, Bluetooth encendido, escaneo, batería
  src/app/pages/{radar,detalle,historial,config}
schema.sql          base de datos reto_ble_radar
```

## Requisitos

- Windows con **XAMPP** (Apache + MySQL/MariaDB, PHP ≥ 8.1).
- **Node.js** 20+ y npm.
- **Android Studio** (SDK de Android y su JDK incluido).
- Celular Android físico con Bluetooth, en la **misma red Wi‑Fi** que la laptop.
- Un periférico BLE anunciándose (nosotros usamos un smartwatch IDW26).

## 1. Backend

1. **Ubicar el proyecto en htdocs.** Clonar o copiar este repositorio como `C:\xampp\htdocs\BLE-Radar-`
   (el backend queda en `C:\xampp\htdocs\BLE-Radar-\backend`). Si se usa otro nombre de carpeta, cambiarlo también en la URL.
2. **Crear la base de datos.** En phpMyAdmin (`http://localhost/phpmyadmin`) → *Importar* → `schema.sql`, o por consola:
   ```powershell
   C:\xampp\mysql\bin\mysql.exe -u root < schema.sql
   ```
   Si MySQL usa otro puerto: `mysql.exe -u root -P 3304 < schema.sql`.
3. **Configurar la conexión.** Copiar `backend/config.example.php` a `backend/config.php` y ajustar
   `port` (3306 por defecto; en algunos XAMPP es **3304**), usuario y contraseña. `config.php` está en `.gitignore`.
4. **Probar en la laptop:** `http://localhost/BLE-Radar-/backend/api/health.php` debe responder
   `{"success":true,"data":{"php":"…","mysql":"ok"}}`. Si la BD falla responde HTTP 503.

### Obtener la IP de la laptop

```powershell
ipconfig
```
Usar la **Dirección IPv4** del adaptador Wi‑Fi (p. ej. `192.168.1.151`). El celular **no** puede usar `localhost`.

### Abrir el puerto 80 en el Firewall de Windows

PowerShell **como administrador**:
```powershell
New-NetFirewallRule -DisplayName "Apache HTTP 80 (BLE Radar)" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -Profile Private
```
La red Wi‑Fi debe estar marcada como **Privada** (Configuración → Red e Internet → Wi‑Fi → Propiedades).
Comprobar desde el navegador del celular: `http://IP_LAPTOP/BLE-Radar-/backend/api/health.php`.

### Pruebas del API con curl

Desde la laptop (cambiar `localhost` por la IP para probar desde otra máquina):

```bash
B=http://localhost/BLE-Radar-/backend/api

curl -i $B/health.php

curl -i -X POST $B/observaciones.php -H "Content-Type: application/json" \
  -d '{"device_id":"AA:BB:CC:DD:EE:01","nombre":"IDW26","rssi":-67,"nota":"prueba curl"}'
# → 201 {"success":true,"data":{"id":1}}

curl -i -X POST $B/observaciones.php -H "Content-Type: application/json" \
  -d '{"device_id":"AA:BB:CC:DD:EE:02","nombre":null,"rssi":null,"nota":""}'
# → 201 (nombre y rssi se guardan como NULL)

curl -i -X POST $B/observaciones.php -H "Content-Type: application/json" -d '{"rssi":50,"nota":""}'
# → 400 {"success":false,"error":"device_id es obligatorio y debe ser texto."}

curl -i -X DELETE $B/observaciones.php
# → 405

curl -i $B/observaciones.php
# → 200 {"success":true,"data":[ ...ordenadas por creado_en DESC... ]}
```

En PowerShell usar `curl.exe` (no el alias `curl`) y escapar las comillas del JSON, o ejecutar los comandos en Git Bash.
Las filas de prueba se pueden borrar después con `DELETE FROM observaciones;` para que el historial de la demo
contenga solo observaciones reales.

Validaciones del POST: `device_id` obligatorio (texto ≤ 128), `nombre` texto ≤ 120 o `null`,
`rssi` entero entre −127 y 20 o `null`, `nota` texto ≤ 255 (se recorta; puede ir vacía). Se usa PDO con
sentencias preparadas; los errores de BD se registran con `error_log` y al usuario se le da un mensaje genérico.

## 2. Frontend y Android

```powershell
cd frontend
npm install
npm run build        # o: ionic build
npx cap sync android
npx cap open android # abre Android Studio
```

En Android Studio conectar el celular (depuración USB activada) y pulsar **Run ▶**.
Tras cualquier cambio en `src/`, repetir `npm run build` y `npx cap sync android`.

Configuración relevante ya aplicada:

- `capacitor.config.ts`: `appId: com.equipofued.bleradar`, `appName: BLE Radar`, `server.androidScheme: 'http'`
  y `cleartext: true` para que el WebView no bloquee peticiones `http://` a la LAN (mixed content).
- `AndroidManifest.xml`: `android:usesCleartextTraffic="true"` y los permisos del README del plugin:
  - Android ≤ 11: `BLUETOOTH`, `BLUETOOTH_ADMIN`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION` (todos con `maxSdkVersion="30"`).
  - Android ≥ 12: `BLUETOOTH_SCAN` con `usesPermissionFlags="neverForLocation"` y `BLUETOOTH_CONNECT`.
  - La app llama `BleClient.initialize({ androidNeverForLocation: true })`, por eso en Android 12+ solo pide
    "Dispositivos cercanos", no ubicación.

### Configurar la URL en la app

Pestaña **Config** → escribir `http://IP_LAPTOP/BLE-Radar-/backend/api` (sin `/` final) → **Probar conexión**.
Debe mostrar la versión de PHP. Si falla, el mensaje indica método, URL, estado HTTP y error
(p. ej. `GET http://… | HTTP sin respuesta | Network Error` = IP, firewall o red incorrectos).

## 3. Pruebas con el IDW26

Los wearables genéricos suelen **dejar de anunciarse** mientras están conectados a su app o emparejados.

1. En el teléfono que normalmente usa el reloj: cerrar la app oficial del reloj (forzar detención) y, en
   *Ajustes → Bluetooth*, **olvidar/desvincular** el IDW26. Si es necesario, apagar el Bluetooth de ese teléfono.
2. Encender la pantalla del reloj y acercarlo a menos de 1 m del celular de la demo.
3. En **Radar** pulsar **Iniciar**. El reloj puede aparecer **con nombre** (p. ej. "IDW26") o como **"Sin nombre"**;
   para reconocerlo, acercarlo/alejarlo y observar cómo cambia el RSSI con el orden por intensidad activado.
4. El `deviceId` en Android es una dirección MAC que puede ser aleatoria y rotar; no se asocia con personas.
5. En **Detalle → Leer batería**: la app se conecta, busca el servicio estándar `0x180F`/`0x2A19` y desconecta.
   Si el reloj no lo expone se muestra **"Servicio de batería no disponible"** (no se inventa ningún valor).
   No se usan UUIDs propietarios del reloj.

## 4. Pruebas de permisos negados y Bluetooth apagado

- **Permisos negados:** desinstalar la app (o *Ajustes → Apps → BLE Radar → Permisos → Dispositivos cercanos → No permitir*),
  abrir Radar y pulsar **Iniciar** → negar el diálogo. La app muestra
  "Permisos de Bluetooth denegados…" con el botón **Abrir ajustes de la app**; no se escanea ni se llama a PHP.
  Tras conceder el permiso, **Reintentar** funciona.
- **Bluetooth apagado:** apagar el Bluetooth y pulsar **Iniciar** → Android ofrece encenderlo. Si se pulsa
  **Cancelar**/"No permitir" aparece "El Bluetooth está apagado y se canceló la solicitud…" con **Abrir ajustes de Bluetooth**.
- **Apagar el Bluetooth durante la búsqueda:** el escaneo se detiene y se avisa "Se apagó el Bluetooth y la búsqueda se detuvo."
- **Detener sin procesos activos:** el botón **Detener**, el tiempo límite de 30 s, cambiar de pestaña o abrir Detalle
  llaman a `stopLEScan()` y cancelan el temporizador. Se puede comprobar en Android Studio → Logcat filtrando por
  `BluetoothLeScanner` / `stopScan`.
- En Android 11 o inferior la **ubicación del sistema** debe estar activada para que aparezcan resultados.

## Privacidad BLE

No se asocian identificadores BLE con personas. Los IDs pueden rotar y el RSSI puede no estar disponible; en ese
caso se guarda `null`.
