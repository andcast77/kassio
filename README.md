# Kassio

Punto de venta **offline** para Windows y Linux: PostgreSQL embebido en producción, un negocio, una caja, varios usuarios.

Proyecto independiente de [multisystem](../multisystem). Shopflow es referencia de UX, no dependencia.

## Desarrollo

### Requisitos

- Node.js 20+
- pnpm (`corepack enable`)
- Docker (solo Postgres en **desarrollo**)

### Primer arranque

```bash
pnpm install
pnpm db:setup    # crea .env + postgres + migrate + seed
pnpm dev         # API :3000 + UI :5173
```

Abrí http://127.0.0.1:5173

| Usuario | Correo | Contraseña |
|---------|--------|------------|
| Admin | `admin@kassio.local` | `Admin123!` |
| Cajero | `cajero@kassio.local` | `Cajero123!` |

### Scripts

| Comando | Qué hace |
|---------|----------|
| `pnpm setup` | Copia `.env.example` → `.env` (si faltan) |
| `pnpm dev` | API + UI |
| `pnpm db:setup` | Setup completo de BD |
| `pnpm test` | Tests API Fase 1 |
| `pnpm typecheck` | TypeScript en todo el monorepo |

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [docs/01-VISION.md](./docs/01-VISION.md) | Visión y alcance |
| [docs/02-REQUIREMENTS.md](./docs/02-REQUIREMENTS.md) | Requisitos |
| [docs/03-ARCHITECTURE.md](./docs/03-ARCHITECTURE.md) | Arquitectura + Postgres embebido |
| [docs/04-DATA-MODEL.md](./docs/04-DATA-MODEL.md) | Modelo de datos |
| [docs/05-ROADMAP.md](./docs/05-ROADMAP.md) | Roadmap |

## Estructura

```
kassio/
├── apps/desktop/       ← UI React + Vite
├── packages/api/       ← Fastify
├── packages/database/  ← Prisma
└── docs/
```

## Estado

**Fase 1 completa** — login, apertura/cierre de caja (API + UI + tests). Siguiente: Fase 2 (catálogo y compras).
