/*
  Warnings:

  - The primary key for the `Food` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `OrderItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_foodId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- AlterTable
ALTER TABLE "Food" DROP CONSTRAINT "Food_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Food_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Food_id_seq";

-- DropTable
DROP TABLE "OrderItem";

-- CreateTable
CREATE TABLE "OrderItemCart" (
    "id" SERIAL NOT NULL,
    "foodId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrderItemCart_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderItemCart" ADD CONSTRAINT "OrderItemCart_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemCart" ADD CONSTRAINT "OrderItemCart_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
