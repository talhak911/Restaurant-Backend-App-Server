/*
  Warnings:

  - You are about to drop the `_FoodToOrder` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `foods` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_FoodToOrder" DROP CONSTRAINT "_FoodToOrder_A_fkey";

-- DropForeignKey
ALTER TABLE "_FoodToOrder" DROP CONSTRAINT "_FoodToOrder_B_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "foods" JSONB NOT NULL;

-- DropTable
DROP TABLE "_FoodToOrder";
