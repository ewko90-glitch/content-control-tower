/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId,slug]` on the table `Domain` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "description" TEXT,
ADD COLUMN     "slug" TEXT,
ALTER COLUMN "siteUrl" DROP NOT NULL,
ALTER COLUMN "wpUsername" DROP NOT NULL,
ALTER COLUMN "wpAppPasswordEnc" DROP NOT NULL,
ALTER COLUMN "wpAppPasswordIv" DROP NOT NULL,
ALTER COLUMN "wpAppPasswordTag" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Domain_workspaceId_slug_key" ON "Domain"("workspaceId", "slug");
