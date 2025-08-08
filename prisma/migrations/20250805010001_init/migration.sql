/*
  Warnings:

  - You are about to drop the `kosimage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `kosimage` DROP FOREIGN KEY `KosImage_kosId_fkey`;

-- AlterTable
ALTER TABLE `kos` ADD COLUMN `picture` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY `name` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY `address` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY `pricePerMonth` INTEGER NOT NULL DEFAULT 0,
    MODIFY `description` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY `facility` VARCHAR(191) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE `user` MODIFY `name` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY `email` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY `password` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY `phone` VARCHAR(191) NOT NULL DEFAULT '';

-- DropTable
DROP TABLE `kosimage`;
