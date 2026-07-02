#!/usr/bin/env node
/**
 * Production-like startup: embedded Postgres → migrate → seed → API.
 * Used by Tauri sidecar and manual smoke tests (`pnpm start:embedded`).
 */
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')

async function main() {
  const { startRuntime, stopRuntime } = await import('../packages/runtime/src/index.ts')

  console.log('[kassio] Starting embedded PostgreSQL…')
  const runtime = await startRuntime({ seed: true })
  console.log('[kassio] Database ready:', runtime.databaseUrl.replace(/:[^:@/]+@/, ':***@'))

  const api = spawn('pnpm', ['--filter', '@kassio/api', 'dev'], {
    cwd: repoRoot,
    env: { ...process.env, DATABASE_URL: runtime.databaseUrl },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  const shutdown = async (signal) => {
    console.log(`[kassio] ${signal} — shutting down…`)
    api.kill('SIGTERM')
    await stopRuntime(runtime)
    process.exit(0)
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))

  api.on('exit', async (code) => {
    await stopRuntime(runtime)
    process.exit(code ?? 0)
  })
}

main().catch((err) => {
  console.error('[kassio] Fatal:', err)
  process.exit(1)
})
