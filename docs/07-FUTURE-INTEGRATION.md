# Integración futura (fuera de v1)

Este documento fija expectativas para **después** del POS local standalone. **No es trabajo actual.**

## Neon (PostgreSQL cloud)

**Por qué Postgres local ahora:** el mismo esquema Prisma puede apuntar a Neon cambiando `DATABASE_URL`.

Pasos futuros probables:

1. Export / sync de ventas y catálogo hacia Neon.
2. Job de sincronización cuando hay conectividad (no bloqueante para caja offline).
3. `prisma migrate deploy` contra branch Neon.

## multisystem / Shopflow

Posibles escenarios:

| Escenario | Descripción |
|-----------|-------------|
| **Export manual** | CSV / JSON de ventas para import en Shopflow |
| **API sync** | Servicio que mapea `Product`, `Sale` local → entidades con `companyId` |
| **Reemplazo gradual** | Negocio pasa de POS local a Shopflow cloud |

### Mapeo conceptual

| POS local | Shopflow / multisystem |
|-----------|------------------------|
| `Business` | `Company` |
| `Product.sku` | `Product.sku` |
| `Sale.receiptNumber` | `Sale.invoiceNumber` |
| (implícito) | `storeId`, `companyId` en export |

Columnas `externalId` o tabla `SyncMapping` se pueden agregar cuando exista el puente — no en v1.

## Impresión y hardware

- v1: impresión HTML
- v2: ESC/POS, cajón de dinero, lector USB

## Multi-sucursal

Requiere rediseño: `Store`, stock por tienda, sync entre cajas. Explícitamente **fuera de v1**.
