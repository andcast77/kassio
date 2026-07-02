# Kassio

Punto de venta **offline** para Windows y Linux: PostgreSQL embebido en producción, un negocio, una caja, varios usuarios.

Proyecto independiente de [multisystem](../multisystem). Shopflow es referencia de UX, no dependencia.

## Desarrollo (Fase 1)

### Requisitos

- Node.js 20+
- pnpm (`corepack enable`)
- Docker (solo para Postgres en **desarrollo**; en producción la app trae Postgres embebido)

### Primer arranque

```bash
pnpm install
cp .env.example .env
cp .env.example packages/api/.env
cp .env.example packages/database/.env
pnpm db:setup    # docker postgres + migrate + seed
pnpm dev         # API :3000 + UI :5173
```

Abrí http://127.0.0.1:5173

**Admin de desarrollo:** `admin@kassio.local` / `Admin123!`

### Scripts

| Comando | Qué hace |
|---------|----------|
| `pnpm dev` | API + UI (levanta Postgres dev si hace falta) |
| `pnpm db:setup` | Postgres docker + migraciones + seed |
| `pnpm db:migrate` | Nueva migración Prisma |
| `pnpm db:studio` | Prisma Studio |

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

## Decisiones

| Tema | Decisión |
|------|----------|
| Producto | **Kassio** (`kassio.app` libre) |
| BD producción | PostgreSQL embebido en el instalador |
| BD desarrollo | Docker Compose (temporal) |
| Monorepo | pnpm workspaces |

## Estado

**Fase 1 en progreso:** login, apertura/cierre de caja (API + UI).
