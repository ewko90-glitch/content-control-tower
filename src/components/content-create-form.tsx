"use client";

import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { useTransition } from "react";
import { createDraft } from "@/app/actions/content";
import { Button } from "@/components/ui/button";

interface FormState {
  success: boolean;
  message?: string;
}

export function ContentCreateForm() {
  const router = useRouter();
  const [state, formAction] = useFormState(createDraft, { success: false });
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createDraft({ success: false }, formData);
      if (result.success) {
        router.push("/content");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="topic" className="block text-sm font-medium text-gray-900">
          Temat treści <span className="text-red-600">*</span>
        </label>
        <input
          id="topic"
          name="topic"
          type="text"
          placeholder="np. Jak zoptymalizować SEO bloga"
          required
          className="mt-2 w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Główny temat, który będzie podstawą treści.
        </p>
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-900">
          Typ treści <span className="text-red-600">*</span>
        </label>
        <select
          id="type"
          name="type"
          required
          className="mt-2 w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Wybierz typ...</option>
          <option value="WP_POST">Post WordPress</option>
          <option value="LINKEDIN_POST">Post LinkedIn</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Gdzie będzie publikowana ta treść?
        </p>
      </div>

      <div>
        <label htmlFor="mainKeyword" className="block text-sm font-medium text-gray-900">
          Główne słowo kluczowe <span className="text-red-600">*</span>
        </label>
        <input
          id="mainKeyword"
          name="mainKeyword"
          type="text"
          placeholder="np. SEO blog"
          required
          className="mt-2 w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Słowo kluczowe dla SEO i organizacji treści.
        </p>
      </div>

      {state && !state.success && state.message && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {isPending ? "Tworzę..." : "Utwórz treść"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-md bg-gray-200 text-gray-900 text-sm font-medium hover:bg-gray-300 transition"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}
