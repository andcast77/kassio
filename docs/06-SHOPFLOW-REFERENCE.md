# Referencia Shopflow (solo guía)

Shopflow vive en el monorepo multisystem:

- App: `multisystem/apps/shopflow`
- POS web: ruta `/pos`
- API cloud: `@multisystem/api` (shopflow routes)

**No importar** paquetes `@multisystem/*` en el POS local v1.

## Componentes UI a estudiar

| Archivo Shopflow | Uso en POS local |
|------------------|------------------|
| `components/features/pos/ProductPanel.tsx` | Grilla / búsqueda de productos |
| `components/features/pos/ShoppingCart.tsx` | Carrito |
| `components/features/pos/TotalsPanel.tsx` | Subtotal, impuestos, descuento |
| `components/features/pos/PaymentModal.tsx` | Medio de pago y confirmación |
| `components/features/pos/ReceiptModal.tsx` | Post-venta |
| `components/features/pos/TicketPrintTemplate.tsx` | Layout del ticket |
| `components/features/pos/CustomerSelector.tsx` | Cliente opcional |
| `views/ShopflowPages.tsx` → `POSPage` | Layout general |

## Flujo de referencia

```
Productos → Carrito → Totales → Pago → Venta guardada → Ticket
```

## Qué NO copiar

| Shopflow | Motivo |
|----------|--------|
| `StoreSelector` | Una sola caja |
| Permisos por `Module` / hub | No hay suite modular |
| `useOffline` / service worker | Siempre BD local |
| Loyalty, facturas AR, multi-tienda | Fuera de alcance v1 |
| Auth cloud / registro empresa | Usuarios locales |

## Modelo Prisma multisystem

Referencia: `multisystem/packages/database/prisma/schema.prisma` — modelos `Product`, `Sale`, `SaleItem`, `Customer`, `Category`, `Supplier`.

Simplificaciones en POS local: sin `companyId`, sin `storeId`, stock en el producto en v1.

## Integración futura

Cuando exista puente con multisystem, mapear campos compatibles (`sku`, `invoiceNumber`, precios). Detalle en [07-FUTURE-INTEGRATION.md](./07-FUTURE-INTEGRATION.md).
