import { copyFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const example = resolve(root, '.env.example')

const targets = [
  resolve(root, '.env'),
  resolve(root, 'packages/api/.env'),
  resolve(root, 'packages/database/.env'),
]

if (!existsSync(example)) {
  console.error('Missing .env.example')
  process.exit(1)
}

for (const target of targets) {
  if (!existsSync(target)) {
    copyFileSync(example, target)
    console.log(`Created ${target}`)
  } else {
    console.log(`Exists  ${target}`)
  }
}

console.log('Setup OK')
