"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTemplate } from "@/app/actions/templates";

export default function NewTemplatePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      startTransition(async () => {
        await createTemplate({
          name: formData.get("name") as string,
          description: formData.get("description") as string,
          topic: formData.get("topic") as string,
          mainKeyword: formData.get("mainKeyword") as string,
          type: formData.get("type") as "WP_POST" | "LINKEDIN_POST",
          outline: formData.get("outline") as string,
          body: formData.get("body") as string,
          metaTitle: formData.get("metaTitle") as string,
          metaDescription: formData.get("metaDescription") as string
        });
        router.push("/settings/templates");
      });
    } catch (error) {
      alert("Błąd przy tworzeniu szablonu");
      console.error(error);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nowy szablon</h1>
          <p className="mt-2 text-base text-gray-600">
            Utwórz nowy szablon treści, aby przyspieszyć tworzenie artykułów.
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Informacje podstawowe
              </h2>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nazwa szablonu *
                </label>
                <Input
                  id="name"
                  name="name"
                  placeholder="np. Blog SEO Article"
                  required
                  disabled={isPending}
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Opis
                </label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Opcjonalny opis szablonu"
                  rows={2}
                  disabled={isPending}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Typ treści *
                  </label>
                  <select
                    id="type"
                    name="type"
                    required
                    disabled={isPending}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="WP_POST">📝 Blog (WordPress)</option>
                    <option value="LINKEDIN_POST">📱 LinkedIn</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="mainKeyword" className="block text-sm font-medium text-gray-700">
                    Główne słowo kluczowe *
                  </label>
                  <Input
                    id="mainKeyword"
                    name="mainKeyword"
                    placeholder="np. SEO optimization"
                    required
                    disabled={isPending}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4 border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Zawartość szablonu
              </h2>

              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
                  Temat *
                </label>
                <textarea
                  id="topic"
                  name="topic"
                  placeholder="Główny temat/tytuł"
                  rows={2}
                  required
                  disabled={isPending}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="outline" className="block text-sm font-medium text-gray-700">
                  Plan artykułu
                </label>
                <textarea
                  id="outline"
                  name="outline"
                  placeholder="1. Wstęp\n2. Główne punkty\n3. Wnioski"
                  rows={4}
                  disabled={isPending}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="body" className="block text-sm font-medium text-gray-700">
                  Zawartość
                </label>
                <textarea
                  id="body"
                  name="body"
                  placeholder="Szablonowa zawartość artykułu"
                  rows={6}
                  disabled={isPending}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* SEO */}
            <div className="space-y-4 border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900">
                SEO
              </h2>

              <div>
                <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700">
                  Meta Title (szablonowy)
                </label>
                <Input
                  id="metaTitle"
                  name="metaTitle"
                  placeholder="Szablon tagu title dla SEO"
                  disabled={isPending}
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700">
                  Meta Description (szablonowa)
                </label>
                <textarea
                  id="metaDescription"
                  name="metaDescription"
                  placeholder="Szablon opisu dla search engines"
                  rows={2}
                  disabled={isPending}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isPending ? "Tworzenie..." : "Utwórz szablon"}
              </Button>
              <Button
                type="button"
                onClick={() => router.back()}
                variant="ghost"
                disabled={isPending}
              >
                Anuluj
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
