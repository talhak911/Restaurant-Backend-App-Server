-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_customerId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItemCart" DROP CONSTRAINT "OrderItemCart_customerId_fkey";

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "customerId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "OrderItemCart" ALTER COLUMN "customerId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "OrderItemCart" ADD CONSTRAINT "OrderItemCart_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
