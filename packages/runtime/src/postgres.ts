import { mkdir } from 'node:fs/promises'
import EmbeddedPostgres from 'embedded-postgres'
import { getPostgresDataDir } from './paths.js'

export function getPgPort(): number {
  return Number(process.env.KASSIO_PG_PORT ?? 55432)
}

export const KASSIO_PG_USER = 'kassio'
export const KASSIO_PG_PASSWORD = process.env.KASSIO_PG_PASSWORD ?? 'kassio-local'
export const KASSIO_DB_NAME = 'kassio'

export function buildDatabaseUrl(port = getPgPort()): string {
  return `postgresql://${KASSIO_PG_USER}:${KASSIO_PG_PASSWORD}@127.0.0.1:${port}/${KASSIO_DB_NAME}`
}

export type EmbeddedPostgresHandle = EmbeddedPostgres

export async function startEmbeddedPostgres(): Promise<EmbeddedPostgresHandle> {
  const databaseDir = getPostgresDataDir()
  await mkdir(databaseDir, { recursive: true })

  const pg = new EmbeddedPostgres({
    databaseDir,
    user: KASSIO_PG_USER,
    password: KASSIO_PG_PASSWORD,
    port: getPgPort(),
    persistent: true,
  })

  await pg.initialise()
  await pg.start()

  try {
    await pg.createDatabase(KASSIO_DB_NAME)
  } catch {
    // Database already exists on subsequent runs.
  }

  return pg
}

export async function stopEmbeddedPostgres(pg: EmbeddedPostgresHandle): Promise<void> {
  await pg.stop()
}
