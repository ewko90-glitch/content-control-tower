import { PrismaClient, Role, ContentType, ContentStatus, PublicationStatus } from "@prisma/client";

const prisma = new PrismaClient();

(async function main() {
  try {
    const workspaceId = "ws_demo";
    const userId = "user_demo";
    const membershipId = "membership_demo";
    const domainId = "domain_demo";
    const contentItemId = "content_demo";
    const publicationJobId = "pubjob_demo";

    const workspace = await prisma.workspace.upsert({
      where: { id: workspaceId },
      update: {},
      create: { id: workspaceId, name: "Demo Workspace" },
    });

    const user = await prisma.user.upsert({
      where: { email: "owner@demo.local" },
      update: { name: "Demo Owner" },
      create: {
        id: userId,
        email: "owner@demo.local",
        name: "Demo Owner",
        passwordHash: "mock-password-hash",
      },
    });

    await prisma.membership.upsert({
      where: { id: membershipId },
      update: {},
      create: {
        id: membershipId,
        userId: user.id,
        workspaceId: workspace.id,
        role: Role.OWNER,
      },
    });

    const domain = await prisma.domain.upsert({
      where: { id: domainId },
      update: {},
      create: {
        id: domainId,
        workspaceId: workspace.id,
        name: "demo.local",
        siteUrl: "https://demo.local",
        wpUsername: "demo",
        wpAppPasswordEnc: "enc",
        wpAppPasswordIv: "iv",
        wpAppPasswordTag: "tag",
      },
    });

    const contentItem = await prisma.contentItem.upsert({
      where: { id: contentItemId },
      update: {},
      create: {
        id: contentItemId,
        workspaceId: workspace.id,
        domainId: domain.id,
        type: ContentType.WP_POST,
        status: ContentStatus.DRAFT,
        topic: "Demo Topic",
        mainKeyword: "demo",
        createdById: user.id,
      },
    });

    await prisma.publicationJob.upsert({
      where: { id: publicationJobId },
      update: {},
      create: {
        id: publicationJobId,
        workspaceId: workspace.id,
        contentItemId: contentItem.id,
        status: PublicationStatus.PENDING,
      },
    });

    console.log("Seed completed:", {
      workspace: workspace.id,
      user: user.email,
      domain: domain.name,
      contentItem: contentItem.id,
    });
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
