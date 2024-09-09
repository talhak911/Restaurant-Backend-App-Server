/*
  Warnings:

  - You are about to drop the column `otp` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `otpExpiresAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "otp",
DROP COLUMN "otpExpiresAt",
DROP COLUMN "status",
ADD COLUMN     "resetPassOtp" TEXT,
ADD COLUMN     "resetPassOtpExpiry" TIMESTAMP(3),
ADD COLUMN     "verification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationOtpExpiry" TIMESTAMP(3),
ADD COLUMN     "verifitcationOtp" TEXT;
