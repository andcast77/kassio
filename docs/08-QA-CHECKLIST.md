# Checklist QA manual — Kassio v1

Usar antes de release en **1360×768** (mínimo 1280×720).

## Instalación y arranque

- [ ] Primera apertura: embedded Postgres inicializa sin Docker
- [ ] Pantalla de login visible tras bootstrap
- [ ] Segunda apertura: no repite initdb (arranque rápido)

## Auth

- [ ] Login admin y cajero con credenciales seed
- [ ] Credenciales inválidas muestran error genérico
- [ ] Logout limpia sesión

## Caja

- [ ] Abrir caja con fondo inicial
- [ ] No permite segunda caja abierta
- [ ] Cerrar caja con efectivo contado

## Catálogo

- [ ] Crear categoría y producto
- [ ] Buscar producto por nombre/SKU
- [ ] Registrar compra incrementa stock

## POS

- [ ] Vender requiere caja abierta
- [ ] Agregar productos al carrito y cobrar (efectivo con vuelto)
- [ ] Ticket imprimible post-venta
- [ ] Stock baja tras venta
- [ ] Anular venta restaura stock

## Ventas del día

- [ ] Total del día coincide con ventas completadas
- [ ] Historial lista ventas de hoy

## Rendimiento

- [ ] Catálogo 5k+ SKUs: listado paginado responde en &lt; 3 s (`pnpm test` phase5)

## Desktop (Tauri)

- [ ] Ventana nativa 1360×768 por defecto
- [ ] API solo en 127.0.0.1
- [ ] Cierre de app apaga Postgres embebido
