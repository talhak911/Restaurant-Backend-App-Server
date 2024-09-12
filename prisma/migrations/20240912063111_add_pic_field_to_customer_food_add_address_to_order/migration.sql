/*
  Warnings:

  - You are about to drop the column `orderId` on the `OrderItemCart` table. All the data in the column will be lost.
  - Added the required column `deliveryAddress` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrderItemCart" DROP CONSTRAINT "OrderItemCart_orderId_fkey";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "picture" TEXT;

-- AlterTable
ALTER TABLE "Food" ADD COLUMN     "picture" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryAddress" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OrderItemCart" DROP COLUMN "orderId";
