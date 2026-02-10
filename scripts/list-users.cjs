const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
// lightweight .env loader to avoid adding deps
try {
  const env = fs.readFileSync('.env', 'utf8');
  env.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx);
    let val = trimmed.slice(idx + 1);
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  });
} catch (e) {
  // ignore if no .env
}

const prisma = new PrismaClient();

(async () => {
  try {
    const users = await prisma.user.findMany({ include: { memberships: true } });
    for (const u of users) {
      if (!u.memberships || u.memberships.length === 0) {
        console.log(`${u.email}\t${null}\t${null}`);
      } else {
        for (const m of u.memberships) {
          console.log(`${u.email}\t${m.role}\t${m.workspaceId}`);
        }
      }
    }
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
