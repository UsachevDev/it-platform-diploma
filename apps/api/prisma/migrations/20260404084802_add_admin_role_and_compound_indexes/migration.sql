-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ADMIN';

-- DropIndex
DROP INDEX "Bid_createdAt_idx";

-- DropIndex
DROP INDEX "Bid_status_idx";

-- DropIndex
DROP INDEX "Project_createdAt_idx";

-- DropIndex
DROP INDEX "Project_status_idx";

-- CreateIndex
CREATE INDEX "Bid_status_createdAt_idx" ON "Bid"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Project_status_createdAt_idx" ON "Project"("status", "createdAt");
