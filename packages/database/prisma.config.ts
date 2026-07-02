import { config } from 'dotenv'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../.env') })
config({ path: resolve(__dirname, '../.env') })

export default {
  schema: 'prisma/schema.prisma',
}
