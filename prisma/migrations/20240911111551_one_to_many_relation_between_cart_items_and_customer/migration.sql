/*
  Warnings:

  - Added the required column `customerId` to the `OrderItemCart` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrderItemCart" DROP CONSTRAINT "OrderItemCart_orderId_fkey";

-- AlterTable
ALTER TABLE "OrderItemCart" ADD COLUMN     "customerId" INTEGER NOT NULL,
ALTER COLUMN "orderId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "OrderItemCart" ADD CONSTRAINT "OrderItemCart_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemCart" ADD CONSTRAINT "OrderItemCart_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
