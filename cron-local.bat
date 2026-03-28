@echo off
echo Ejecutando cron de reporte diario...
echo URL: http://localhost:3000
curl "http://localhost:3000/api/cron/daily-reports?key=8f2c9a6e4d1b7c3f5a9e2d8c6b4f1a7e3c9d2f6b8a1e4c7d9f2a6b3c5d8e1f0a"
echo.
echo Listo. Presiona Enter para salir.
pause
