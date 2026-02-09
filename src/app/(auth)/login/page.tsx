"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });
    setLoading(false);
    if (result?.error) {
      setError("Nieprawidłowy email lub hasło.");
      return;
    }
    window.location.href = "/workspaces";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold">Zaloguj się</h1>
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}
        <form action={handleSubmit} className="space-y-4">
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="password" type="password" placeholder="Hasło" required />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Logowanie..." : "Zaloguj"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-gray-600">
          Nie masz konta?{" "}
          <Link className="text-blue-600" href="/register">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  );
}
