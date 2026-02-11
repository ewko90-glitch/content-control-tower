-- AlterTable
ALTER TABLE "ContentItem" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "publishAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "publishError" TEXT,
ADD COLUMN     "scheduledById" TEXT;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_scheduledById_fkey" FOREIGN KEY ("scheduledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
