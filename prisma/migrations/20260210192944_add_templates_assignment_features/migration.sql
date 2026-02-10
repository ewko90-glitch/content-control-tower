-- AlterTable
ALTER TABLE "ContentItem" ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "ContentTemplate" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "topic" TEXT NOT NULL,
    "mainKeyword" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "outline" TEXT,
    "body" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentTemplate_workspaceId_idx" ON "ContentTemplate"("workspaceId");

-- CreateIndex
CREATE INDEX "ContentItem_assignedToId_idx" ON "ContentItem"("assignedToId");

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ContentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentTemplate" ADD CONSTRAINT "ContentTemplate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
