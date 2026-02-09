"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { registerUser } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

const initialState = { success: false };

export default function RegisterPage() {
  const [state, formAction] = useFormState(registerUser, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold">Rejestracja</h1>
        {state.message && (
          <Alert variant={state.success ? "success" : "error"} className="mb-4">
            {state.message}
          </Alert>
        )}
        {state.success && (
          <Alert variant="success" className="mb-4">
            Konto utworzone. Przejdź do logowania.
          </Alert>
        )}
        <form action={formAction} className="space-y-4">
          <Input name="name" placeholder="Imię i nazwisko" required />
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="password" type="password" placeholder="Hasło" required />
          <Button type="submit" className="w-full">
            Utwórz konto
          </Button>
        </form>
        <p className="mt-4 text-sm text-gray-600">
          Masz konto? <Link className="text-blue-600" href="/login">Zaloguj się</Link>
        </p>
      </div>
    </div>
  );
}
