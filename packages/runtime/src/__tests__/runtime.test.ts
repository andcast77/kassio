import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootstrapDatabase, buildDatabaseUrl, startEmbeddedPostgres, stopEmbeddedPostgres } from '../index.js'

describe('embedded runtime', () => {
  let pg: Awaited<ReturnType<typeof startEmbeddedPostgres>>
  let dataDir = ''

  beforeAll(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'kassio-runtime-'))
    process.env.KASSIO_DATA_DIR = dataDir
    process.env.KASSIO_PG_PORT = String(55433 + Math.floor(Math.random() * 100))
    pg = await startEmbeddedPostgres()
  }, 120_000)

  afterAll(async () => {
    await stopEmbeddedPostgres(pg)
    delete process.env.KASSIO_DATA_DIR
  })

  it('connects and runs migrations', async () => {
    const url = buildDatabaseUrl()
    await bootstrapDatabase(url, { seed: false })
    const client = pg.pg.getPgClient()
    await client.connect()
    const result = await client.query('SELECT 1 AS ok')
    expect(result.rows[0].ok).toBe(1)
    await client.end()
  }, 120_000)
})
