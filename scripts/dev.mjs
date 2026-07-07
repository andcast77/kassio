#!/usr/bin/env node
/**
 * Dev stack: embedded Postgres runtime → API + Vite UI.
 */
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')

async function main() {
  const { startRuntime, stopRuntime } = await import('../packages/runtime/dist/index.js')

  console.log('[kassio] Embedded dev: starting PostgreSQL…')
  const runtime = await startRuntime({ seed: true })
  const env = { ...process.env, DATABASE_URL: runtime.databaseUrl }

  const command =
    'pnpm concurrently -n api,ui -c blue,green "pnpm --filter @kassio/api dev" "pnpm --filter @kassio/desktop dev"'

  const child = process.platform === 'win32'
    ? spawn(command, { cwd: repoRoot, env, stdio: 'inherit', shell: true })
    : spawn(
        'pnpm',
        [
          'concurrently',
          '-n',
          'api,ui',
          '-c',
          'blue,green',
          'pnpm --filter @kassio/api dev',
          'pnpm --filter @kassio/desktop dev',
        ],
        { cwd: repoRoot, env, stdio: 'inherit' },
      )

  const shutdown = async () => {
    child.kill('SIGTERM')
    await stopRuntime(runtime)
    process.exit(0)
  }

  process.on('SIGINT', () => void shutdown())
  process.on('SIGTERM', () => void shutdown())

  child.on('exit', async (code) => {
    await stopRuntime(runtime)
    process.exit(code ?? 0)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
