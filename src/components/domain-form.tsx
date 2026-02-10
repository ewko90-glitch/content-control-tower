"use client";

import { useTransition } from "react";
import { useFormState } from "react-dom";
import type { DomainState } from "@/app/actions/domains";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Alert } from "./ui/alert";

type Props = {
  action: (state: DomainState, formData: FormData) => Promise<DomainState>;
  initialName?: string;
  initialSlug?: string;
  initialDescription?: string;
  submitLabel: string;
  onSuccess?: () => void;
};

export function DomainForm({
  action,
  initialName = "",
  initialSlug = "",
  initialDescription = "",
  submitLabel,
  onSuccess
}: Props) {
  const [state, formAction] = useFormState(action, { success: false });
  const [isPending, startTransition] = useTransition();

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "")
      .slice(0, 100);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nameInput = e.target;
    const slugInput = (nameInput.form?.elements.namedItem("slug") as HTMLInputElement) || null;
    if (slugInput && !slugInput.value) {
      slugInput.value = generateSlug(nameInput.value);
    }
  };

  const handleSubmit = (formData: FormData) => {
    startTransition(() => {
      formAction(formData);
      if (state.success && onSuccess) {
        onSuccess();
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      {state.message && (
        <Alert variant={state.success ? "success" : "error"}>{state.message}</Alert>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nazwa domeny
        </label>
        <Input
          id="name"
          name="name"
          placeholder="np. Główna marka"
          defaultValue={initialName}
          onChange={handleNameChange}
          required
          disabled={isPending}
          className="mt-1"
        />
        <p className="mt-1 text-xs text-gray-500">Użyteczna, czytelna nazwa dla zespołu.</p>
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
          Identyfikator (URL)
        </label>
        <Input
          id="slug"
          name="slug"
          placeholder="np. glowna-marka"
          pattern="^[a-z0-9_-]+$"
          defaultValue={initialSlug}
          required
          disabled={isPending}
          className="mt-1"
          title="Może zawierać tylko małe litery, cyfry, myślniki i podkreślenia"
        />
        <p className="mt-1 text-xs text-gray-500">
          Unikalny identyfikator w tym workspace. Automatycznie generowany z nazwy.
        </p>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Opis
        </label>
        <textarea
          id="description"
          name="description"
          placeholder="np. Zawiera treści dotyczące głównej marki"
          defaultValue={initialDescription}
          disabled={isPending}
          rows={3}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">Opcjonalnie, pomaga zespołowi zrozumieć cel takiej domeny.</p>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Przetwarzanie..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
