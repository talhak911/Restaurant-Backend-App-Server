/*
  Warnings:

  - Added the required column `totalPrice` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'ACTIVE';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "totalPrice" DOUBLE PRECISION NOT NULL;
