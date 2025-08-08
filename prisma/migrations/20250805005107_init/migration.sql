/*
  Warnings:

  - You are about to drop the `kosfacility` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `description` to the `Kos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `facility` to the `Kos` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `kosfacility` DROP FOREIGN KEY `KosFacility_kosId_fkey`;

-- AlterTable
ALTER TABLE `kos` ADD COLUMN `description` VARCHAR(191) NOT NULL,
    ADD COLUMN `facility` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `kosfacility`;
