# Requisitos

## Contexto operativo

| Dimensión | v1 |
|-----------|-----|
| Negocios | 1 |
| Cajas / registros | 1 |
| Usuarios | Varios (cajeros + admin) |
| Red | Sin dependencia de internet |
| SO objetivo | Windows y Linux (instalable); desarrollo en cualquier SO |
| BD | PostgreSQL embebido (incluido en el instalador; datos en carpeta de usuario) |

## Requisitos funcionales

### RF-01 Autenticación

- El sistema DEBE permitir login con usuario y contraseña.
- DEBE distinguir al menos roles **Admin** y **Cajero**.
- DEBE cerrar sesión de forma explícita.
- NO DEBE revelar si el usuario existe ante credenciales inválidas.

### RF-02 Sesión de caja

- Un cajero DEBE abrir caja (fondo inicial) antes de registrar ventas.
- DEBE registrar cierre con arqueo (efectivo contado vs esperado).
- NO DEBE completar ventas si no hay sesión de caja abierta.

### RF-03 Productos

- CRUD de productos: nombre, precio, costo opcional, SKU, código de barras, categoría, activo/inactivo.
- Búsqueda rápida en pantalla de venta (nombre, SKU, barras).
- Stock visible en catálogo y en POS.

### RF-04 Ventas

- Armar carrito con cantidades editables.
- Cliente opcional por venta.
- Descuentos (línea o total — definir en implementación).
- Medios de pago: efectivo, tarjeta, transferencia, otro.
- Al confirmar: persistir venta, descontar stock, numerar comprobante local.
- Rechazar venta si stock insuficiente (salvo override admin futuro).

### RF-05 Compras (entrada de mercadería)

- Registrar compra a proveedor con ítems y cantidades.
- Al confirmar: incrementar stock.
- Historial de compras consultable.

### RF-06 Clientes y proveedores

- CRUD clientes (nombre, contacto, dirección).
- CRUD proveedores (nombre, CUIT/tax id, contacto).

### RF-07 Inventario

- Stock = compras − ventas + ajustes manuales.
- Ajuste manual con motivo (auditoría).
- Alerta visual de stock bajo (umbral por producto).

### RF-08 Tickets

- Generar comprobante tras venta (ítems, totales, medio de pago, datos del negocio).
- v1: preview HTML e impresión vía diálogo del sistema.
- Impresora térmica: fuera de v1.

### RF-09 Consultas básicas

- Listado de ventas por fecha.
- Total del día.
- Productos más vendidos (ranking simple).

## Requisitos no funcionales

| ID | Requisito |
|----|-----------|
| NFR-01 | Operación core sin conexión a internet |
| NFR-02 | API local escuchando solo en `127.0.0.1` |
| NFR-03 | Contraseñas hasheadas (bcrypt o equivalente) |
| NFR-04 | Esquema PostgreSQL compatible con Neon |
| NFR-05 | Respuesta de búsqueda de productos &lt; 200 ms con catálogo típico (&lt; 10k SKUs) |
| NFR-06 | Instalable en Windows sin herramientas de desarrollo (meta fase 4) |

## Fuera de alcance v1

- Multi-sucursal / multi-empresa
- Sincronización cloud
- Integración `@multisystem/api`
- Facturación electrónica / AFIP
- Puntos de loyalty
- Lector de barras y térmica como drivers nativos
- macOS como target de instalación (Linux sí entra en v1 desktop)
