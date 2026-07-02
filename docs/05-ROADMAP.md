# Roadmap

## Fase 0 — Documentación ✅

- Visión, requisitos, arquitectura, modelo de datos
- Referencia Shopflow
- **Sin código**

## Fase 1 — Fundación

- Inicializar repo git + monorepo mínimo
- PostgreSQL + Prisma + migración inicial
- Seed: negocio, admin, productos demo
- Login / logout
- Apertura y cierre de caja (API)

**Criterio de salida:** cajero entra, abre caja.

## Fase 2 — Catálogo y compras

- CRUD productos, categorías, clientes, proveedores
- Flujo de compra + incremento de stock
- Ajustes de inventario + log de movimientos

**Criterio de salida:** admin carga mercadería; stock visible en catálogo.

## Fase 3 — Ventas (POS)

- Pantalla de caja (layout inspirado en Shopflow)
- Carrito → pago → venta persistida
- Ticket HTML
- Historial y total del día

**Criterio de salida:** venta completa offline con comprobante.

## Fase 4 — Desktop empaquetado

- Shell Tauri 2 (ventana nativa; no navegador)
- API como sidecar local
- **PostgreSQL embebido** (binarios por SO, subproceso, datos en carpeta de usuario)
- Instaladores: Windows (.msi / NSIS) y Linux (.deb / AppImage)
- Primer arranque: initdb + migraciones + seed automáticos

**Criterio de salida:** app instalable sin Node/pnpm, Docker ni Postgres aparte en la PC del cliente.

## Fase 5 — Calidad

- Tests unitarios (totales, stock, auth)
- QA manual checklist
- Prueba con catálogo grande (5k+ SKUs)

## Después de v1

| Tema | Notas |
|------|-------|
| Neon / sync | Ver [07-FUTURE-INTEGRATION.md](./07-FUTURE-INTEGRATION.md) |
| multisystem / Shopflow | Puente de entidades |
| Impresora térmica | ESC/POS |
| Lector de barras | Keyboard wedge + USB |
| Multi-caja | Requiere `storeId` + sync |
