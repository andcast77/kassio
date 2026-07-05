/**
 * Production install bootstrap — technical defaults only (no demo business/users/products).
 * Full demo data: `pnpm --filter @kassio/database db:seed` (development).
 */
import { prisma } from '../src/client.js'

async function main() {
  await prisma.ticketSequence.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default', lastNumber: 0 },
  })

  await prisma.voucherSequence.upsert({
    where: { puntoVenta_voucherType: { puntoVenta: 1, voucherType: 11 } },
    update: {},
    create: { puntoVenta: 1, voucherType: 11, lastNumber: 0 },
  })

  console.log('[kassio] install bootstrap OK (schema + sequences)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
