-- CreateEnum
CREATE TYPE "SiteType" AS ENUM ('WORDPRESS', 'SHOPIFY', 'OTHER');

-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SiteType" NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "status" "SiteStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "wpAdminUrl" TEXT,
    "wpUsername" TEXT,
    "wpAppPasswordEnc" TEXT,
    "wpAppPasswordIv" TEXT,
    "wpAppPasswordTag" TEXT,
    "shopifyShopDomain" TEXT,
    "shopifyAccessTokenEnc" TEXT,
    "shopifyAccessTokenIv" TEXT,
    "shopifyAccessTokenTag" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Site_workspaceId_idx" ON "Site"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Site_workspaceId_name_key" ON "Site"("workspaceId", "name");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
