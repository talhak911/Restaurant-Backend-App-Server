/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "phone" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_id_key" ON "Customer"("id");
