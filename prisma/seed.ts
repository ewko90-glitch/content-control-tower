import { PrismaClient, Role, ContentType, ContentStatus, PublicationStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Deterministic IDs for demo data
  const workspaceId = "ws_demo";
  const userId = "user_demo";
  const membershipId = "membership_demo";
  const domainId = "domain_demo";
  const contentItemId = "content_demo";
  const publicationJobId = "pubjob_demo";

  const workspace = await prisma.workspace.upsert({
    where: { id: workspaceId },
    update: {},
    create: {
      id: workspaceId,
      name: "Demo Workspace",
    },
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { encryptSecret } from "../src/lib/encryption";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashPassword("Password123!");
  const user = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: {},
    create: {
      email: "owner@example.com",
      name: "Owner Demo",
      passwordHash
    }
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: "Demo Workspace",
      memberships: {
        create: {
          userId: user.id,
          role: "OWNER"
        }
      }
    }
  });

  const encrypted = encryptSecret("demo-app-password");
  await prisma.domain.create({
    data: {
      workspaceId: workspace.id,
      name: "Demo WP",
      siteUrl: "https://example.com",
      wpUsername: "demo-user",
      wpAppPasswordEnc: encrypted.ciphertext,
      wpAppPasswordIv: encrypted.iv,
      wpAppPasswordTag: encrypted.tag
    }
  });

  await prisma.externalLink.createMany({
    data: [
      { workspaceId: workspace.id, url: "https://developer.mozilla.org", label: "MDN" },
      { workspaceId: workspace.id, url: "https://nextjs.org", label: "Next.js" },
      { workspaceId: workspace.id, url: "https://wordpress.org", label: "WordPress" }
    ]
  });

  await prisma.contentItem.create({
    data: {
      workspaceId: workspace.id,
      type: "WP_POST",
      status: "DRAFT",
      topic: "Content Marketing 101",
      mainKeyword: "content marketing",
      createdById: user.id
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
