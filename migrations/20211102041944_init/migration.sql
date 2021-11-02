-- CreateTable
CREATE TABLE `Contributors` (
    `user` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `commits` INTEGER NOT NULL,
    `avatarUrl` VARCHAR(191) NOT NULL,
    `deletions` INTEGER NOT NULL,
    `additions` INTEGER NOT NULL,
    `raidStatsRaidId` VARCHAR(191) NULL,

    UNIQUE INDEX `Contributors_user_key`(`user`),
    UNIQUE INDEX `Contributors_userId_key`(`userId`),
    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RaidStats` (
    `raidId` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'INCOMPLETE', 'COMPLETE') NOT NULL,
    `dungeon` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `duration` INTEGER NOT NULL,
    `changedFiles` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NOT NULL,
    `deletions` INTEGER NOT NULL,
    `additions` INTEGER NOT NULL,
    `commits` INTEGER NOT NULL,

    UNIQUE INDEX `RaidStats_raidId_key`(`raidId`),
    PRIMARY KEY (`raidId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
