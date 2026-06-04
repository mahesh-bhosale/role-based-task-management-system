-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `is_read` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `notifications_is_read_idx` ON `notifications`(`is_read`);
