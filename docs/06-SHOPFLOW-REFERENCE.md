# Referencia Shopflow (solo guía)

Shopflow vive en el monorepo multisystem:

| Pieza | Ruta |
|-------|------|
| App UI | `multisystem/apps/shopflow` |
| POS | ruta `/pos` → `POSPage` en `src/views/ShopflowPages.tsx` |
| API | `multisystem/apps/api/src/controllers/v1/shopflow/*` |
| Lógica negocio | `multisystem/apps/api/src/services/shopflow-*.service.ts`, `products.service.ts` |
| Schema | `multisystem/packages/database/prisma/schema.prisma` (modelos Shopflow) |
| DTOs Zod API | `multisystem/apps/api/src/dto/shopflow.dto.ts` |
| Validaciones UI | `multisystem/apps/shopflow/src/lib/validations/*.ts` |

**No importar** paquetes `@multisystem/*` en Kassio v1. Copiar **patrones**, no dependencias.

---

## Mapa rápido: Kassio vs Shopflow

| Tema | Shopflow (cloud) | Kassio (local) |
|------|------------------|----------------|
| Tenancy | `companyId` + `storeId` | Single-tenant, una caja |
| Stock | `StoreInventory` por tienda | `Product.stockQuantity` en v1 |
| Sesión de caja | **No existe** | `CashSession` — propio de Kassio |
| Compras a proveedor | **No existe** (usa ajustes de inventario) | `Purchase` + `PurchaseItem` — hay que implementar |
| Auth | Cloud / hub / registro empresa | JWT local, usuarios en BD |
| Numeración ticket | `store_configs.invoiceNumber` + prefix | `TicketSequence` |
| Impuestos | `storeConfig.taxRate` | Pendiente (Business o config local) |

---

## Fase 2 — Catálogo (copiar/adaptar)

### API (prioridad alta)

| Shopflow | Qué tomar |
|----------|-----------|
| `services/products.service.ts` | Listado con búsqueda, paginación, filtros, CRUD |
| `services/shopflow-categories.service.ts` | CRUD categorías |
| `services/shopflow-customers.service.ts` | CRUD clientes |
| `services/shopflow-suppliers.service.ts` | CRUD proveedores |
| `dto/shopflow.dto.ts` | Schemas Zod de entrada (quitar `companyId` / `storeId`) |

### Validaciones UI → replicar en Kassio

| Archivo Shopflow | Uso |
|------------------|-----|
| `lib/validations/product.ts` | Alta/edición producto (`sku`, `barcode`, `price`, `stock`) |
| `lib/validations/category.ts` | Categorías |
| `lib/validations/customer.ts` | Clientes |
| `lib/validations/supplier.ts` | Proveedores |
| `lib/validations/inventory.ts` | Ajustes manuales (Fase 2 stock) |

### UI (referencia de pantallas)

| Shopflow | Kassio |
|----------|--------|
| `components/features/products/ProductForm.tsx` | Form producto |
| `components/features/products/ProductList.tsx` | Listado + búsqueda |
| `components/features/customers/*` | CRUD clientes |
| `components/features/suppliers/*` | CRUD proveedores |
| `CategoriesPage` en `ShopflowPages.tsx` | CRUD categorías simple |

### Inventario / stock

Shopflow **no** tiene flujo “compra a proveedor”. Usa:

- `updateProductInventory` en `shopflow.service.ts` → escribe `storeInventory`
- `InventoryAdjustmentForm.tsx` + `adjustInventorySchema` → ajuste con motivo

En Kassio:

- **Compras** → lógica nueva sobre `Purchase` (incrementa `stockQuantity` + `StockMovement`)
- **Ajustes** → inspirarse en `InventoryAdjustmentForm` + audit log

---

## Fase 3 — POS / ventas (copiar/adaptar)

### Flujo UI (POSPage)

```
ProductPanel → ShoppingCart → TotalsPanel → PaymentModal → ReceiptModal
     ↑              ↑
CustomerSelector   cartStore (zustand)
```

| Componente Shopflow | Qué copiar |
|---------------------|------------|
| `ProductPanel.tsx` | Grilla virtual, búsqueda, foco en input, escaneo barras (`useBarcodeScanner`) |
| `ShoppingCart.tsx` | Líneas, cantidades, quitar ítem |
| `TotalsPanel.tsx` | Subtotal, IVA, botón cobrar |
| `PaymentModal.tsx` | Medio de pago, monto pagado, vuelto (sin loyalty) |
| `ReceiptModal.tsx` | Post-venta |
| `TicketPrintTemplate.tsx` | Layout ticket HTML / print |
| `store/cartStore.ts` | Estado carrito (Zustand): ítems, descuentos %, cliente |

**Quitar del PaymentModal:** loyalty (`useRedeemPoints`, `useCustomerPoints`), `storeContext`.

**Quitar del POSPage:** `StoreSelector`.

**Layout desktop:** viewport de diseño **1360×768**; layout ancho fijo (productos + carrito), sin mobile.

### API ventas (prioridad máxima)

Archivo clave: **`shopflow-sales.service.ts`** → `createSale`, `cancelSale`, `listSales`

Lógica a portar (adaptando stock a `Product.stockQuantity`):

1. Validar productos activos
2. Validar stock suficiente
3. Validar cliente opcional
4. Calcular subtotal, descuento, IVA, total
5. Validar `paidAmount >= total`
6. `$transaction`: numerar comprobante, crear `Sale` + `SaleItem`, descontar stock
7. Cancelación: revertir stock

Controller de referencia: `controllers/v1/shopflow/sales.controller.ts` + `createSaleSchema`.

Frontend service: `lib/services/saleService.ts` + `hooks/useSales.ts`.

### Consultas básicas (RF-09)

| Shopflow | Kassio |
|----------|--------|
| `shopflow-reports.service.ts` → `getToday`, `getTopProducts` | Total del día, ranking |
| `StatsCards`, `DailySalesChart` | Dashboard post-MVP |

---

## UI slice 1 — Sidebar + Dashboard (SDD: `shopflow-ui-slice-1`)

Porte incremental de la **arquitectura de información** de Shopflow sin `@multisystem/ui`.

| Shopflow | Kassio (slice 1) |
|----------|------------------|
| `Sidebar` con grupos Principal / Gestión | `apps/desktop/src/layout/Sidebar.tsx` + `routes.ts` |
| `DashboardPage` + `StatsCards` | `DashboardPage.tsx` — tarjetas + gráfico CSS |
| `DailySalesChart` (recharts) | Barras CSS en `.bar-chart` (sin recharts) |
| `TopProductsTable` | Tabla en dashboard |
| `shopflow-reports.service.ts` | `packages/api/src/services/reports.service.ts` |
| Rutas `/reports/*` | `GET /api/v1/reports/stats|daily|top-products|inventory` |

**Fuera de slice 1:** selectores empresa/tienda, loyalty, permisos granulares, recharts, pixel-perfect.

---

## UI slice 2 — POS screen (SDD: `shopflow-ui-slice-2`)

| Shopflow | Kassio (slice 2) |
|----------|------------------|
| `POSPage` layout 5/12 + 7/12 | `PosPage` + `.pos-grid` |
| `ProductPanel` virtual + barcode | `components/pos/ProductPanel.tsx` |
| `ShoppingCart` tabular + desc. ítem % | `ShoppingCart.tsx` |
| `TotalsPanel` desc. global % | `TotalsPanel.tsx` |
| `PaymentModal` / `ReceiptModal` | Modales separados |
| `CustomerSelector` | Opcional, sin loyalty |
| `cartStore` (zustand) | `store/cartStore.ts` + `useSyncExternalStore` |

**Fuera de slice 2:** loyalty, StoreSelector, IVA en total (`taxRate=0` hasta `Sale.tax`).

Descuentos UI (% ítem + % global) → `discount` ($) en `createSale`.

Próximos slices: listado/form productos, ajustes inventario, fidelizar dashboard.

---

## Qué NO copiar

| Shopflow | Motivo |
|----------|--------|
| `StoreSelector`, `StoreContext` | Una sola caja |
| `companyId` / policies multi-tenant | Single-tenant |
| `useOffline`, service worker | Siempre BD local |
| Loyalty (`loyaltyService`, puntos en pago) | Fuera v1 |
| Facturas AR / `invoiceService` | Fuera v1 |
| Push notifications, SSE metrics | Cloud |
| Auth cloud / registro / Turnstile | Usuarios locales |
| `StoreInventory` / transfers multi-sucursal | Stock en producto v1 |
| `@multisystem/ui` directo | Kassio UI propia (React + Vite); tomar **layout**, no el paquete |

---

## Modelo Prisma — equivalencias

| Shopflow | Kassio |
|----------|--------|
| `Company` | `Business` (1 fila) |
| `Store` | Implícito (sin tabla) |
| `StoreInventory.quantity` | `Product.stockQuantity` |
| `StoreConfig.taxRate`, `invoicePrefix` | Config negocio / `TicketSequence` |
| `Sale.invoiceNumber` | `Sale.ticketNumber` + `TicketSequence` |
| `Sale.tax` | Campo a agregar si se usa IVA como Shopflow |
| `Sale.paidAmount`, `change` | Útiles para efectivo en POS |

Campos Shopflow en `Sale` que Kassio aún no tiene: `tax`, `paidAmount`, `change` — considerar antes de Fase 3.

---

## Tests de referencia (multisystem)

| Test | Utilidad para Kassio |
|------|----------------------|
| `shopflow-sales.service` (si existen) | Totales, stock |
| `shopflow-tenant-mutation-isolation` | No aplica (single-tenant) |
| Patrón `vitest` + `app.inject` en API | Ya usado en Kassio Fase 1 |

---

## Orden sugerido al portar

1. **Zod schemas** desde `validations/` y `shopflow.dto.ts`
2. **Services** API (products → categories → customers → suppliers)
3. **Pantallas CRUD** simples en desktop
4. **cartStore** + componentes POS (sin loyalty/store)
5. **`createSale`** adaptado de `shopflow-sales.service.ts`
6. **Ticket** desde `TicketPrintTemplate`

---

## Integración futura

Cuando exista puente con multisystem, mapear: `sku`, `barcode`, precios, `invoiceNumber` ↔ ticket. Ver [07-FUTURE-INTEGRATION.md](./07-FUTURE-INTEGRATION.md).
