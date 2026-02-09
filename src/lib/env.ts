export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  nextAuthSecret: process.env.NEXTAUTH_SECRET ?? "",
  nextAuthUrl: process.env.NEXTAUTH_URL ?? "",
  encryptionKey: process.env.ENCRYPTION_KEY ?? ""
};

export function requireEnv(value: string, name: string): string {
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}
