/*
  Warnings:

  - Added the required column `category` to the `Food` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Food` table without a default value. This is not possible if the table is not empty.
  - Added the required column `restaurantId` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "foodCategory" AS ENUM ('SNACKS', 'MEAL', 'VEGAN', 'DESSERT', 'DRINKS');

-- AlterTable
ALTER TABLE "Food" ADD COLUMN     "category" "foodCategory" NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "restaurantId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
