export { getKassioDataDir, getPostgresDataDir } from './paths.js'
export {
  buildDatabaseUrl,
  startEmbeddedPostgres,
  stopEmbeddedPostgres,
  getPgPort,
  KASSIO_PG_USER,
  KASSIO_PG_PASSWORD,
  KASSIO_DB_NAME,
  type EmbeddedPostgresHandle,
} from './postgres.js'
export { bootstrapDatabase, runMigrations, runSeedIfNeeded } from './bootstrap.js'

import {
  buildDatabaseUrl,
  startEmbeddedPostgres,
  stopEmbeddedPostgres,
} from './postgres.js'
import { bootstrapDatabase } from './bootstrap.js'

export type RuntimeState = {
  databaseUrl: string
  postgres: Awaited<ReturnType<typeof startEmbeddedPostgres>>
}

export async function startRuntime(options?: { seed?: boolean }): Promise<RuntimeState> {
  const postgres = await startEmbeddedPostgres()
  const databaseUrl = buildDatabaseUrl()
  process.env.DATABASE_URL = databaseUrl
  await bootstrapDatabase(databaseUrl, options)
  return { databaseUrl, postgres }
}

export async function stopRuntime(state: RuntimeState): Promise<void> {
  await stopEmbeddedPostgres(state.postgres)
}
