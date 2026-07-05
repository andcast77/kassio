-- Ticket interno de caja vs comprobante fiscal AFIP (asignado al facturar)

ALTER TABLE "Sale" ADD COLUMN "ticketNumber" INTEGER;

UPDATE "Sale" SET "ticketNumber" = "voucherNumber" WHERE "ticketNumber" IS NULL;
ALTER TABLE "Sale" ALTER COLUMN "ticketNumber" SET NOT NULL;

ALTER TABLE "Sale" ALTER COLUMN "puntoVenta" DROP NOT NULL;
ALTER TABLE "Sale" ALTER COLUMN "puntoVenta" DROP DEFAULT;
ALTER TABLE "Sale" ALTER COLUMN "voucherType" DROP NOT NULL;
ALTER TABLE "Sale" ALTER COLUMN "voucherType" DROP DEFAULT;
ALTER TABLE "Sale" ALTER COLUMN "voucherNumber" DROP NOT NULL;

CREATE TABLE "TicketSequence" (
    "id" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TicketSequence_pkey" PRIMARY KEY ("id")
);

INSERT INTO "TicketSequence" ("id", "lastNumber")
SELECT 'default', COALESCE((SELECT MAX("ticketNumber") FROM "Sale"), 0);

CREATE UNIQUE INDEX "Sale_ticketNumber_key" ON "Sale"("ticketNumber");
