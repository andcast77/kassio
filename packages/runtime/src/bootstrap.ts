import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '../../..')

function run(command: string, args: string[], env: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
  })
}

export async function runMigrations(databaseUrl: string): Promise<void> {
  const env = { ...process.env, DATABASE_URL: databaseUrl }
  await run('pnpm', ['--filter', '@kassio/database', 'migrate:deploy'], env)
}

export async function runSeedIfNeeded(databaseUrl: string): Promise<void> {
  const env = { ...process.env, DATABASE_URL: databaseUrl }
  const marker = join(repoRoot, 'packages/database/prisma/seed.ts')
  if (!existsSync(marker)) return
  await run('pnpm', ['--filter', '@kassio/database', 'db:seed'], env)
}

export async function bootstrapDatabase(databaseUrl: string, options?: { seed?: boolean }): Promise<void> {
  await runMigrations(databaseUrl)
  if (options?.seed !== false) {
    await runSeedIfNeeded(databaseUrl)
  }
}
