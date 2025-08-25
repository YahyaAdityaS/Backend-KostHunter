/*
  Warnings:

  - You are about to drop the column `roomAvilable` on the `kos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `kos` DROP COLUMN `roomAvilable`,
    ADD COLUMN `roomAvailable` INTEGER NOT NULL DEFAULT 0;
