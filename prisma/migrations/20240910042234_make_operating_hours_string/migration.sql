/*
  Warnings:

  - You are about to drop the column `foodId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `verifitcationOtp` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `OperatingHours` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `category` on the `Food` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `name` to the `Restaurant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `operatingHours` to the `Restaurant` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'DELIVERED', 'CANCELED');

-- CreateEnum
CREATE TYPE "FoodCategory" AS ENUM ('SNACKS', 'MEAL', 'VEGAN', 'DESSERT', 'DRINKS');

-- DropForeignKey
ALTER TABLE "OperatingHours" DROP CONSTRAINT "OperatingHours_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_foodId_fkey";

-- AlterTable
ALTER TABLE "Food" DROP COLUMN "category",
ADD COLUMN     "category" "FoodCategory" NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "foodId",
DROP COLUMN "quantity",
DROP COLUMN "totalPrice",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "operatingHours" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "verifitcationOtp",
ADD COLUMN     "verificationOtp" TEXT;

-- DropTable
DROP TABLE "OperatingHours";

-- DropEnum
DROP TYPE "DayOfWeek";

-- DropEnum
DROP TYPE "foodCategory";

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" SERIAL NOT NULL,
    "foodId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
