# Ejecutar en PowerShell desde la carpeta de trabajo, con Ionic CLI disponible.
# Se crea el cascarón REAL usando la versión de Ionic vigente en el laboratorio.
ionic start ble_radar blank --type=angular-standalone --capacitor --no-interactive
Set-Location ble_radar
npm install axios
npm install @capacitor-community/bluetooth-le
# Si el proyecto no incluye carpeta android:
# npx cap add android
# Luego instalar/sincronizar plugins:
npx cap sync android
# Prueba primero en navegador para API/UI y finalmente en Android físico.
