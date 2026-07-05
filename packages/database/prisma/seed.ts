/**
 * Development/demo seed — demo business, users, products.
 * Production installs use install-bootstrap.ts (migrations + sequences only).
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { prisma, UserRole } from '../src/client.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../../.env') })
config({ path: resolve(__dirname, '../.env') })

const ADMIN_EMAIL = 'admin@kassio.local'
const ADMIN_PASSWORD = 'Admin123!'
const CASHIER_EMAIL = 'cajero@kassio.local'
const CASHIER_PASSWORD = 'Cajero123!'

async function main() {
  const business = await prisma.business.upsert({
    where: { id: 'seed-business' },
    update: { taxRate: 0.21, puntoVenta: 1 },
    create: {
      id: 'seed-business',
      name: 'Kassio Demo',
      taxId: '30-00000000-0',
      taxRate: 0.21,
      puntoVenta: 1,
      address: 'Av. Demo 123',
      phone: '+54 11 0000-0000',
    },
  })

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, name: 'Administrador', role: UserRole.ADMIN, active: true },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      name: 'Administrador',
      role: UserRole.ADMIN,
    },
  })

  const cashierHash = await bcrypt.hash(CASHIER_PASSWORD, 10)
  const cashier = await prisma.user.upsert({
    where: { email: CASHIER_EMAIL },
    update: { passwordHash: cashierHash, name: 'Cajero Demo', role: UserRole.CASHIER, active: true },
    create: {
      email: CASHIER_EMAIL,
      passwordHash: cashierHash,
      name: 'Cajero Demo',
      role: UserRole.CASHIER,
    },
  })

  const category = await prisma.category.upsert({
    where: { id: 'seed-category' },
    update: {},
    create: { id: 'seed-category', name: 'General' },
  })

  const products = [
    { sku: 'SKU-001', name: 'Agua 500ml', price: 800, stock: 48, barcode: '7790001000011', taxRate: 0.21 },
    { sku: 'SKU-002', name: 'Gaseosa 1.5L', price: 1500, stock: 24, barcode: '7790001000028', taxRate: 0.21 },
    { sku: 'SKU-003', name: 'Snack mix', price: 1200, stock: 30, barcode: '7790001000035', taxRate: 0.105 },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        price: p.price,
        taxRate: p.taxRate,
        stockQuantity: p.stock,
        barcode: p.barcode,
        categoryId: category.id,
        active: true,
      },
      create: {
        sku: p.sku,
        name: p.name,
        price: p.price,
        taxRate: p.taxRate,
        stockQuantity: p.stock,
        barcode: p.barcode,
        categoryId: category.id,
      },
    })
  }

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

  console.log('Seed OK')
  console.log(`  Business: ${business.name}`)
  console.log(`  Admin:    ${admin.email} / ${ADMIN_PASSWORD}`)
  console.log(`  Cajero:   ${cashier.email} / ${CASHIER_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
