-- Numeración AFIP: punto de venta + tipo + correlativo

ALTER TABLE "Business" ADD COLUMN "puntoVenta" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "Sale" ADD COLUMN "puntoVenta" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Sale" ADD COLUMN "voucherType" INTEGER NOT NULL DEFAULT 11;
ALTER TABLE "Sale" ADD COLUMN "voucherNumber" INTEGER;
ALTER TABLE "Sale" ADD COLUMN "cae" TEXT;
ALTER TABLE "Sale" ADD COLUMN "caeExpiresAt" TIMESTAMP(3);

UPDATE "Sale" SET "voucherNumber" = "ticketNumber" WHERE "voucherNumber" IS NULL;
ALTER TABLE "Sale" ALTER COLUMN "voucherNumber" SET NOT NULL;

ALTER TABLE "Sale" DROP COLUMN "ticketNumber";

CREATE TABLE "VoucherSequence" (
    "id" TEXT NOT NULL,
    "puntoVenta" INTEGER NOT NULL,
    "voucherType" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VoucherSequence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VoucherSequence_puntoVenta_voucherType_key" ON "VoucherSequence"("puntoVenta", "voucherType");

INSERT INTO "VoucherSequence" ("id", "puntoVenta", "voucherType", "lastNumber")
SELECT
    'migrated-default',
    1,
    11,
    COALESCE((SELECT "lastNumber" FROM "TicketSequence" WHERE "id" = 'default'), 0)
WHERE EXISTS (SELECT 1 FROM "TicketSequence" WHERE "id" = 'default')
   OR NOT EXISTS (SELECT 1 FROM "TicketSequence");

INSERT INTO "VoucherSequence" ("id", "puntoVenta", "voucherType", "lastNumber")
SELECT 'seed-default', 1, 11, 0
WHERE NOT EXISTS (
    SELECT 1 FROM "VoucherSequence" WHERE "puntoVenta" = 1 AND "voucherType" = 11
);

DROP TABLE "TicketSequence";

CREATE UNIQUE INDEX "Sale_puntoVenta_voucherType_voucherNumber_key" ON "Sale"("puntoVenta", "voucherType", "voucherNumber");
