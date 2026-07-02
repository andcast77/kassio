# Visión y alcance

## Problema

Multisystem **Shopflow** es una aplicación web modular en la nube: hub, inventario avanzado, reportes, loyalty, multi-tenant, etc. Para un comercio que necesita **solo caja en mostrador**, eso es demasiado: depende de internet, mezcla módulos y no se instala como app de Windows.

## Solución

Un **POS local**: una aplicación de escritorio enfocada en vender en el mostrador, con todos los datos en la PC del negocio.

## Usuario objetivo

- Comercio minorista con **una sucursal** y **una caja registradora**
- Varios empleados (cajeros + dueño/admin)
- Necesita trabajar **sin internet**
- Quiere algo instalable en **Windows**

## Qué es (v1)

- Catálogo de productos (alta, edición, búsqueda por nombre/código de barras)
- **Ventas** en mostrador (carrito, cobro, ticket)
- **Compras** a proveedores (entrada de mercadería / stock)
- Clientes y proveedores
- Control de **stock** (ventas restan, compras suman, ajustes manuales)
- **Apertura y cierre de caja** por turno
- **Usuarios** con login (varios cajeros)
- **Tickets** imprimibles (v1: vista HTML / impresión del sistema; impresora térmica después)

## Qué no es (v1)

- No es parte del hub multisystem
- No es multi-sucursal ni multi-empresa
- No sincroniza con la nube (Neon / API multisystem) — documentado para después
- No incluye workify, facturación electrónica fiscal, loyalty, ni módulos ERP
- No define aún drivers de impresora térmica o lector de barras USB

## Principios

1. **Offline first** — si no hay red, el negocio sigue operando.
2. **PostgreSQL** — estándar, portable a Neon cuando haga falta.
3. **Un solo producto** — no “suite modular”; pantallas de caja + administración mínima necesaria.
4. **Integración después** — el diseño no bloquea un futuro puente con Shopflow, pero v1 no lo implementa.

## Referencia

Shopflow POS (`multisystem/apps/shopflow`, ruta `/pos`) es la guía de flujo de pantalla: grilla de productos, carrito, totales, pago, comprobante. Ver [06-SHOPFLOW-REFERENCE.md](./06-SHOPFLOW-REFERENCE.md).
