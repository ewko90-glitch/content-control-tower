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
