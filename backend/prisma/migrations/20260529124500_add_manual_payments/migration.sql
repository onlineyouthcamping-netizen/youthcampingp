-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "payment_method" TEXT NOT NULL DEFAULT 'upi',
ADD COLUMN     "payment_status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "upi_reference" TEXT;
