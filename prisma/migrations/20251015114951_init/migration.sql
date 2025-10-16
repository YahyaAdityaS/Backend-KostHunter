/*
  Warnings:

  - You are about to drop the column `facility` on the `kos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `kos` DROP COLUMN `facility`;

-- CreateTable
CREATE TABLE `Facility` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kosId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NULL DEFAULT '',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Facility` ADD CONSTRAINT `Facility_kosId_fkey` FOREIGN KEY (`kosId`) REFERENCES `Kos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
