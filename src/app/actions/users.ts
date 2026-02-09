"use server";

import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validators";
import { hashPassword } from "@/lib/password";

export type RegisterState = { success: boolean; message?: string };

export async function registerUser(_: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password")
  });
  if (!parsed.success) {
    return { success: false, message: "Nieprawidłowe dane rejestracji." };
  }
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { success: false, message: "Użytkownik już istnieje." };
  }
  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash
    }
  });
  return { success: true, message: "Konto utworzone." };
}
