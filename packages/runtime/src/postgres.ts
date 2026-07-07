import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { platform } from 'node:os'
import EmbeddedPostgres from 'embedded-postgres'
import { getPostgresDataDir } from './paths.js'
import {
  spawnPostgresUnprivileged,
  stopPostgresUnprivileged,
  type PostgresLauncherProcess,
} from './win-postgres-launcher.js'

export function getPgPort(): number {
  return Number(process.env.KASSIO_PG_PORT ?? 55432)
}

export const KASSIO_PG_USER = 'kassio'
export const KASSIO_PG_PASSWORD = process.env.KASSIO_PG_PASSWORD ?? 'kassio-local'
export const KASSIO_DB_NAME = 'kassio'

export function buildDatabaseUrl(port = getPgPort()): string {
  return `postgresql://${KASSIO_PG_USER}:${KASSIO_PG_PASSWORD}@127.0.0.1:${port}/${KASSIO_DB_NAME}`
}

export type EmbeddedPostgresHandle = {
  pg: EmbeddedPostgres
  /** Only set on win32: the postgres process runs under a launcher with a restricted token. */
  winProcess?: PostgresLauncherProcess
}

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

  // initdb refuses to run against an already-initialized data directory
  // (existing cluster), so only run it the first time.
  const alreadyInitialised = existsSync(join(databaseDir, 'PG_VERSION'))
  if (!alreadyInitialised) {
    await pg.initialise()
  }

  let winProcess: PostgresLauncherProcess | undefined
  if (platform() === 'win32') {
    const { postgres: postgresBinary } = await import('@embedded-postgres/windows-x64')
    winProcess = await spawnPostgresUnprivileged(postgresBinary, databaseDir, getPgPort(), (message) =>
      console.log(message),
    )
  } else {
    await pg.start()
  }

  try {
    const client = pg.getPgClient()
    await client.connect()
    await client.query(`CREATE DATABASE ${client.escapeIdentifier(KASSIO_DB_NAME)}`)
    await client.end()
  } catch {
    // Database already exists on subsequent runs.
  }

  return { pg, winProcess }
}

export async function stopEmbeddedPostgres(handle: EmbeddedPostgresHandle): Promise<void> {
  if (handle.winProcess) {
    await stopPostgresUnprivileged(handle.winProcess)
    return
  }
  await handle.pg.stop()
}
