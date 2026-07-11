# Kassio

Punto de venta **offline** para Windows y Linux: PostgreSQL embebido en producción, un negocio, una caja, varios usuarios.

Proyecto independiente de [multisystem](../multisystem). Shopflow es referencia de UX, no dependencia.

## Desarrollo

### Requisitos

- Node.js 20+
- pnpm (`corepack enable`)
- Rust (solo para build Tauri / instaladores)

### Primer arranque

```bash
pnpm install
pnpm dev   # Postgres embebido + migrate + seed + API :3000 + UI :1420
```

Mismo motor Postgres que producción — no requiere Docker ni Postgres del sistema.

Abrí http://127.0.0.1:1420

| Usuario | Correo | Contraseña |
|---------|--------|------------|
| Admin | `admin@kassio.local` | `Admin123!` |
| Cajero | `cajero@kassio.local` | `Cajero123!` |

### Scripts

| Comando | Qué hace |
|---------|----------|
| `pnpm setup` | Copia `.env.example` → `.env` (si faltan) |
| `pnpm dev` | Postgres embebido + API + UI |
| `pnpm start:embedded` | Postgres embebido + API (producción-like) |
| `pnpm test` | Tests API + runtime embebido |
| `pnpm typecheck` | TypeScript en todo el monorepo |
| `pnpm --filter @kassio/desktop tauri:dev` | Ventana nativa Tauri (requiere Rust) |

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [docs/01-VISION.md](./docs/01-VISION.md) | Visión y alcance |
| [docs/02-REQUIREMENTS.md](./docs/02-REQUIREMENTS.md) | Requisitos |
| [docs/03-ARCHITECTURE.md](./docs/03-ARCHITECTURE.md) | Arquitectura + Postgres embebido |
| [docs/04-DATA-MODEL.md](./docs/04-DATA-MODEL.md) | Modelo de datos |
| [docs/05-ROADMAP.md](./docs/05-ROADMAP.md) | Roadmap |
| [docs/08-QA-CHECKLIST.md](./docs/08-QA-CHECKLIST.md) | Checklist QA manual |

## Estructura

```
kassio/
├── apps/desktop/         ← UI React + Vite + Tauri
├── packages/api/         ← Fastify
├── packages/database/    ← Prisma
├── packages/runtime/     ← Postgres embebido + bootstrap
└── docs/
```

## Estado

**Fases 0–5 completas** — POS offline, catálogo, compras, ventas, runtime embebido, Tauri scaffold, tests.
