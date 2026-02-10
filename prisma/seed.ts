import { PrismaClient, Role, ContentType, ContentStatus, PublicationStatus } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { encryptSecret } from "../src/lib/encryption";

const prisma = new PrismaClient();

async function main() {
  // Demo user
  const user = await prisma.user.upsert({
    where: { email: "owner@demo.local" },
    update: {},
    create: {
      email: "owner@demo.local",
      name: "Demo Owner",
      passwordHash: "mock-password-hash"
    }
  });

  // Demo workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: "ws_demo" },
    update: {},
    create: {
      id: "ws_demo",
      name: "Demo Workspace"
    }
  });

  // Membership
  await prisma.membership.upsert({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: workspace.id
      }
    },
    update: {},
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: Role.OWNER
    }
  });

  // Example domains with new slug field
  const domains = [
    {
      name: "Główna marka",
      slug: "glowna-marka",
      description: "Zawiera treści dotyczące głównej marki firmy"
    },
    {
      name: "Produkt Premium",
      slug: "produkt-premium",
      description: "Dedykowana linia produktów premium"
    },
    {
      name: "Kampania sezonu",
      slug: "kampania-sezonu",
      description: "Kampania marketingowa na ten sezon"
    }
  ];

  for (const domainData of domains) {
    await prisma.domain.upsert({
      where: {
        workspaceId_slug: {
          workspaceId: workspace.id,
          slug: domainData.slug
        }
      },
      update: {},
      create: {
        workspaceId: workspace.id,
        name: domainData.name,
        slug: domainData.slug,
        description: domainData.description
      }
    });
  }

  console.log("Seed completed:", {
    workspace: workspace.name,
    user: user.email,
    domains: domains.length
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
