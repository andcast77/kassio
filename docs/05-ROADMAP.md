# Roadmap

## Fase 0 — Documentación ✅

- Visión, requisitos, arquitectura, modelo de datos
- Referencia Shopflow
- **Sin código**

## Fase 1 — Fundación ✅

- Repo git + monorepo pnpm (`apps/desktop`, `packages/api`, `packages/database`)
- PostgreSQL (dev: Docker) + Prisma + migración inicial
- Seed: negocio, admin, cajero, productos demo
- Login / logout (API + UI)
- Apertura y cierre de caja (API + UI)
- Tests API Fase 1 (auth + caja)

**Criterio de salida:** cajero entra, abre caja. ✅

## Fase 2 — Catálogo y compras ✅

- CRUD productos, categorías, clientes, proveedores (API)
- Flujo de compra + incremento de stock + `StockMovement`
- Ajustes de inventario (API)
- UI desktop: shell 1360px, Caja, Productos, Categorías, Compras
- Tests API Fase 2 (catálogo + compra)

**Criterio de salida:** admin carga mercadería; stock visible en catálogo. ✅

## Fase 3 — Ventas (POS) ✅

- Pantalla de venta (grilla + carrito + cobro)
- Carrito → pago → venta persistida + descuento de stock
- Ticket HTML / imprimir
- Historial del día + total + anulación

**Criterio de salida:** venta completa offline con comprobante. ✅

## Fase 4 — Desktop empaquetado ✅

- Shell Tauri 2 (`apps/desktop/src-tauri`) — ventana 1360×768, mín 1280×720
- Runtime embebido (`packages/runtime`) — Postgres local + migrate + seed
- Scripts: `pnpm dev:embedded`, `pnpm start:embedded`
- Build instaladores: `pnpm --filter @kassio/desktop tauri:build` (requiere Rust)

**Criterio de salida:** app instalable sin Docker ni Postgres aparte. ✅ (runtime + Tauri scaffold)

## Fase 5 — Calidad ✅

- Tests unitarios totales/efectivo (`phase5-unit`)
- Tests catálogo grande 5k SKUs (`phase5-large-catalog`)
- Checklist QA manual (`docs/08-QA-CHECKLIST.md`)
- Tests API Fases 1–3 + runtime embebido

**Criterio de salida:** suite verde + checklist documentado. ✅

## Después de v1

| Tema | Notas |
|------|-------|
| Neon / sync | Ver [07-FUTURE-INTEGRATION.md](./07-FUTURE-INTEGRATION.md) |
| multisystem / Shopflow | Puente de entidades |
| Impresora térmica | ESC/POS |
| Lector de barras | Keyboard wedge + USB |
| Multi-caja | Requiere `storeId` + sync |
