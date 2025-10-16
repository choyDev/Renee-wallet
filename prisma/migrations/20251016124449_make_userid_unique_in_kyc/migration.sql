/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `FiatDeposit` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `FiatDeposit_userId_key` ON `FiatDeposit`(`userId`);
