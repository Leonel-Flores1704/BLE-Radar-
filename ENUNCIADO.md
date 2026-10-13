# Reto 03 · BLE Radar

**Título:** Radar e historial de dispositivos Bluetooth Low Energy

**Tecnología central:** `@capacitor-community/bluetooth-le`. **Equipo:** 5 estudiantes. **Tiempo límite:** 3 horas. **IA:** permitida.

## Situación problema
Construir un escáner de dispositivos BLE cercanos, visualizar los datos que publican y registrar en un backend las observaciones de búsqueda.

## Pantallas mínimas
- Radar: iniciar y detener búsqueda BLE; mostrar resultados con nombre, identificador y RSSI si existen.
- Detalle: dispositivo seleccionado y datos capturados.
- Historial: observaciones almacenadas con fecha y nombre/identificador.

## Funcionalidades obligatorias
- [ ] Pedir permisos BLE requeridos según la versión de Android.
- [ ] Iniciar y detener búsqueda de anuncios Bluetooth LE desde la app.
- [ ] Listar únicamente datos disponibles realmente; mostrar “sin nombre” cuando corresponda.
- [ ] Seleccionar un dispositivo detectado, agregar nota breve y enviarlo a PHP con Axios.
- [ ] Guardar device_id, nombre, rssi (si existe), nota y fecha; consultar el historial.

## Qué se debe probar ante el docente
1. Ejecutar búsqueda en Android y mostrar al menos un anuncio BLE detectado.
2. Detener búsqueda sin dejar procesos activos.
3. Registrar tres observaciones reales y recuperarlas desde MySQL.
4. Comprobar comportamiento al negar permisos y cuando el Bluetooth está apagado.

## Extras (únicamente si se cumple todo lo anterior)
- Conectar a un periférico real y leer batería (servicio 0x180F) si está disponible.
- Ordenar dispositivos por intensidad RSSI.
- Evitar entradas duplicadas durante una misma búsqueda.

## Advertencias y límites reales
Este plugin funciona sólo como central BLE, no como periférico. NO exigir que una segunda app en otro celular reciba los datos mediante GATT; eso requiere otro plugin o código nativo. Para pruebas disponer de al menos un periférico BLE anunciándose; los identificadores BLE pueden ser aleatorios/temporales.

## Evidencias de entrega
1. Proyecto Ionic con `package.json` (no `node_modules`).
2. Endpoints PHP y script SQL funcional.
3. Capturas/video de la ejecución real en Android (incluye uso del plugin).
4. `README.md` para desplegar frontend, backend y configurar IP/puertos.
5. Archivo `IA_USADA.md` con tres ejemplos de prompts y qué se validó.

La API y la persistencia deben probarse en red local, no con listas estáticas ni mocks. Véase `CONTRATO_API.md`.
