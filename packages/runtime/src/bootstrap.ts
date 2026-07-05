import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Monorepo root when running from packages/runtime/src (dev). */
function monorepoRoot(): string {
  return join(__dirname, '../../..')
}

/** Staged backend root inside Tauri resources (production). */
function bundledBackendRoot(): string | null {
  const root = process.env.KASSIO_BACKEND_ROOT
  return root && existsSync(root) ? root : null
}

function resolvePaths(): { backendRoot: string; prismaDir: string; schemaPath: string } {
  const bundled = bundledBackendRoot()
  if (bundled) {
    const prismaDir = join(bundled, 'prisma')
    return {
      backendRoot: bundled,
      prismaDir,
      schemaPath: join(prismaDir, 'schema.prisma'),
    }
  }
  const root = monorepoRoot()
  return {
    backendRoot: root,
    prismaDir: join(root, 'packages/database/prisma'),
    schemaPath: join(root, 'packages/database/prisma/schema.prisma'),
  }
}

function run(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  cwd: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
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

function prismaCli(backendRoot: string): string {
  return join(backendRoot, 'node_modules/prisma/build/index.js')
}

function tsxCli(backendRoot: string): string {
  return join(backendRoot, 'node_modules/tsx/dist/cli.mjs')
}

export async function runMigrations(databaseUrl: string): Promise<void> {
  const { backendRoot, prismaDir, schemaPath } = resolvePaths()
  const bundled = bundledBackendRoot()

  if (bundled) {
    await run(
      process.execPath,
      [prismaCli(backendRoot), 'migrate', 'deploy', '--schema', schemaPath],
      { ...process.env, DATABASE_URL: databaseUrl },
      prismaDir,
    )
    return
  }

  await run('pnpm', ['--filter', '@kassio/database', 'migrate:deploy'], {
    ...process.env,
    DATABASE_URL: databaseUrl,
  }, backendRoot)
}

export async function runSeedIfNeeded(databaseUrl: string): Promise<void> {
  const { backendRoot, prismaDir } = resolvePaths()
  const bundled = bundledBackendRoot()

  if (bundled) {
    const seedJs = join(backendRoot, 'node_modules/@kassio/database/dist/prisma/seed.js')
    const seedTs = join(backendRoot, 'node_modules/@kassio/database/prisma/seed.ts')
    const seedEntry = existsSync(seedJs) ? seedJs : seedTs
    if (!existsSync(seedEntry)) return

    if (seedEntry.endsWith('.ts')) {
      await run(
        process.execPath,
        [tsxCli(backendRoot), seedEntry],
        { ...process.env, DATABASE_URL: databaseUrl },
        prismaDir,
      )
    } else {
      await run(
        process.execPath,
        [seedEntry],
        { ...process.env, DATABASE_URL: databaseUrl },
        prismaDir,
      )
    }
    return
  }

  await run('pnpm', ['--filter', '@kassio/database', 'db:seed'], {
    ...process.env,
    DATABASE_URL: databaseUrl,
  }, backendRoot)
}

export async function bootstrapDatabase(databaseUrl: string, options?: { seed?: boolean }): Promise<void> {
  await runMigrations(databaseUrl)
  if (options?.seed !== false) {
    await runSeedIfNeeded(databaseUrl)
  }
}
