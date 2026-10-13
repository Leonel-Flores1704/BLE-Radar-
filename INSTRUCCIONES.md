# Integración del starter Axios

1. Generar Ionic con el script PowerShell o Ionic CLI.
2. `npm install axios`.
3. Crear `src/app/services/`; copiar `api.service.ts` allí.
4. Inyectar el servicio en componentes standalone: `private api = inject(ApiService)`.
5. Configurar `api.setBaseUrl('http://IP_DE_LAPTOP:80/RUTA/api')` en una pantalla de configuración antes de usar GET/POST.
6. Implementar pantallas + plugin. Los alumnos deben implementar por sí mismos las funciones específicas, para conservar la evaluación práctica.
