#!/usr/bin/env node
/**
 * Stage production backend + portable Node into Tauri resources.
 * Usage: node scripts/stage-backend.mjs [--target=linux|windows]
 */
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync, createWriteStream, chmodSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')
const installDir = resolve(repoRoot, 'apps/desktop/src-tauri/install')
const resourcesRoot = resolve(repoRoot, 'apps/desktop/src-tauri/resources')
const backendRoot = resolve(resourcesRoot, 'backend')
const nodeRoot = resolve(resourcesRoot, 'node')

const NODE_VERSION = 'v22.16.0'

function detectTarget() {
  const arg = process.argv.find((a) => a.startsWith('--target='))?.split('=')[1]
  if (arg === 'windows' || arg === 'win') return 'windows'
  if (arg === 'linux') return 'linux'
  const triple = process.env.TAURI_ENV_TARGET_TRIPLE ?? ''
  if (triple.includes('windows')) return 'windows'
  return process.platform === 'win32' ? 'windows' : 'linux'
}

function run(cmd, args, cwd = repoRoot) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

async function download(url, dest) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed ${url}: ${res.status}`)
  await pipeline(res.body, createWriteStream(dest))
}

async function stageNode(target) {
  rmSync(nodeRoot, { recursive: true, force: true })
  mkdirSync(nodeRoot, { recursive: true })

  const cache = join(repoRoot, '.cache/node')
  mkdirSync(cache, { recursive: true })

  if (target === 'linux') {
    const name = `node-${NODE_VERSION}-linux-x64`
    const tarPath = join(cache, `${name}.tar.xz`)
    const url = `https://nodejs.org/dist/${NODE_VERSION}/${name}.tar.xz`
    if (!existsSync(tarPath)) await download(url, tarPath)
    const extractDir = join(cache, 'extract-linux')
    rmSync(extractDir, { recursive: true, force: true })
    mkdirSync(extractDir, { recursive: true })
    run('tar', ['-xJf', tarPath, '-C', extractDir])
    cpSync(join(extractDir, name, 'bin/node'), join(nodeRoot, 'node'))
    chmodSync(join(nodeRoot, 'node'), 0o755)
  } else {
    const name = `node-${NODE_VERSION}-win-x64`
    const zipPath = join(cache, `${name}.zip`)
    const url = `https://nodejs.org/dist/${NODE_VERSION}/${name}.zip`
    if (!existsSync(zipPath)) await download(url, zipPath)
    const extractDir = join(cache, 'extract-win')
    rmSync(extractDir, { recursive: true, force: true })
    mkdirSync(extractDir, { recursive: true })
    run('unzip', ['-q', zipPath, '-d', extractDir])
    cpSync(join(extractDir, name, 'node.exe'), join(nodeRoot, 'node.exe'))
  }
}

async function stageBackend() {
  rmSync(backendRoot, { recursive: true, force: true })
  mkdirSync(backendRoot, { recursive: true })

  run('pnpm', ['--filter', '@kassio/database', 'build'])
  run('pnpm', ['--filter', '@kassio/runtime', 'build'])
  run('pnpm', ['--filter', '@kassio/api', 'build'])
  run('pnpm', ['--filter', '@kassio/bundle', 'deploy', backendRoot, '--prod'])

  const prismaSrc = join(repoRoot, 'packages/database/prisma')
  cpSync(prismaSrc, join(backendRoot, 'prisma'), { recursive: true })

  run(
    process.execPath,
    [
      join(backendRoot, 'node_modules/prisma/build/index.js'),
      'generate',
      '--schema',
      join(backendRoot, 'prisma/schema.prisma'),
    ],
    backendRoot,
  )
}

function stageInstallHelpers() {
  const cmdSrc = join(installDir, 'install-setup.cmd')
  cpSync(cmdSrc, join(resourcesRoot, 'install-setup.cmd'))
}

const target = detectTarget()
console.log(`[stage-backend] target=${target}`)
await stageBackend()
await stageNode(target)
stageInstallHelpers()
console.log(`[stage-backend] ready: ${resourcesRoot}`)
