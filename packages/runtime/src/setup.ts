import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getKassioDataDir } from './paths.js'
import { buildDatabaseUrl, startEmbeddedPostgres, stopEmbeddedPostgres } from './postgres.js'
import { bootstrapDatabase } from './bootstrap.js'

const SETUP_MARKER = '.kassio-initialized'

export function getSetupMarkerPath(): string {
  return join(getKassioDataDir(), SETUP_MARKER)
}

export function isKassioInitialized(): boolean {
  return existsSync(getSetupMarkerPath())
}

export async function markKassioInitialized(): Promise<void> {
  const dataDir = getKassioDataDir()
  await mkdir(dataDir, { recursive: true })
  await writeFile(getSetupMarkerPath(), `${new Date().toISOString()}\n`, 'utf8')
}

/** One-shot: init Postgres, migrate, seed, then stop. Used by the installer. */
export async function initializeKassioData(options?: { seed?: boolean }): Promise<void> {
  if (isKassioInitialized()) {
    console.log('[kassio] data already initialized — skipping setup')
    return
  }

  console.log('[kassio] preparing local database (first install)…')
  const postgres = await startEmbeddedPostgres()
  const databaseUrl = buildDatabaseUrl()
  process.env.DATABASE_URL = databaseUrl

  try {
    await bootstrapDatabase(databaseUrl, { seed: options?.seed ?? true })
    await markKassioInitialized()
    console.log('[kassio] database ready')
  } finally {
    await stopEmbeddedPostgres(postgres)
  }
}
