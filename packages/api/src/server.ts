import { config } from 'dotenv'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildApp } from './app.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootEnv = join(__dirname, '../../../.env')
const apiEnv = join(__dirname, '../.env')

if (existsSync(rootEnv)) config({ path: rootEnv })
if (existsSync(apiEnv)) config({ path: apiEnv })

const host = process.env.API_HOST ?? '127.0.0.1'
const port = Number(process.env.API_PORT ?? 3000)

const app = await buildApp({ logger: true })

try {
  await app.listen({ host, port })
  app.log.info(`Kassio API listening on http://${host}:${port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
