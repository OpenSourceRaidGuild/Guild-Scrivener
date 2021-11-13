-- AlterTable
ALTER TABLE `Contributors` ADD COLUMN `filesUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `RaidStats` MODIFY `duration` INTEGER NULL;

-- CreateTable
CREATE TABLE `Files` (
    `url` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `deletions` INTEGER NOT NULL,
    `raidStatsRaidId` VARCHAR(191) NULL,

    UNIQUE INDEX `Files_url_key`(`url`),
    PRIMARY KEY (`url`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
