#!/usr/bin/env node
/**
 * Production backend — starts API only (DB prepared at install time).
 * Falls back to one-time setup if the installer hook did not run.
 */
import { initializeKassioData, isKassioInitialized, startRuntime, stopRuntime } from '@kassio/runtime'

if (!isKassioInitialized()) {
  console.log('[kassio] first run without install setup — initializing now…')
  await initializeKassioData({ seed: true })
}

const state = await startRuntime({ seed: false })
await import('@kassio/api/dist/server.js')

const shutdown = async (signal) => {
  console.log(`[kassio] ${signal} — shutting down…`)
  await stopRuntime(state)
  process.exit(0)
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
