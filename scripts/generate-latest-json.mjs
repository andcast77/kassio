#!/usr/bin/env node
/**
 * Write latest.json for Tauri updater (GitHub Releases static JSON).
 * Run after `tauri build` when createUpdaterArtifacts is v1Compatible.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const tauriConf = JSON.parse(
  readFileSync(join(repoRoot, 'apps/desktop/src-tauri/tauri.conf.json'), 'utf8'),
)
const version = tauriConf.version
const nsisDir = join(repoRoot, 'apps/desktop/src-tauri/target/release/bundle/nsis')

const files = readdirSync(nsisDir)
const zipName = files.find((f) => f.endsWith('.nsis.zip'))
if (!zipName) {
  console.error('[latest.json] no *setup.nsis.zip in', nsisDir)
  process.exit(1)
}

const sigPath = join(nsisDir, `${zipName}.sig`)
const signature = readFileSync(sigPath, 'utf8').trim()
const tag = version.startsWith('v') ? version : `v${version}`
const url = `https://github.com/andcast77/kassio/releases/download/${tag}/${zipName}`

const latest = {
  version,
  notes: `Kassio ${version}`,
  pub_date: new Date().toISOString(),
  platforms: {
    'windows-x86_64': {
      signature,
      url,
    },
  },
}

const outPath = join(repoRoot, 'apps/desktop/src-tauri/target/release/bundle/latest.json')
writeFileSync(outPath, `${JSON.stringify(latest, null, 2)}\n`)
console.log(`[latest.json] wrote ${outPath} → ${zipName}`)
