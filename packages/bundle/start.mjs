#!/usr/bin/env node
/**
 * Production backend entry — embedded Postgres, migrations, seed, API.
 * Bundled inside the Tauri app; uses process.execPath (bundled Node).
 */
import { startRuntime, stopRuntime } from '@kassio/runtime'

const state = await startRuntime({ seed: true })
await import('@kassio/api/dist/server.js')

const shutdown = async (signal) => {
  console.log(`[kassio] ${signal} — shutting down…`)
  await stopRuntime(state)
  process.exit(0)
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
