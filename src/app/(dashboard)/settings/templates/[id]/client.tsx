"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateTemplate, deleteTemplate } from "@/app/actions/templates";

interface TemplateDetailPageProps {
  template: any;
}

export function TemplateDetailClient({ template: initialTemplate }: TemplateDetailPageProps) {
  const [template, setTemplate] = useState(initialTemplate);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      startTransition(async () => {
        await updateTemplate(template.id, {
          name: formData.get("name") as string,
          description: formData.get("description") as string,
          topic: formData.get("topic") as string,
          mainKeyword: formData.get("mainKeyword") as string,
          outline: formData.get("outline") as string,
          body: formData.get("body") as string,
          metaTitle: formData.get("metaTitle") as string,
          metaDescription: formData.get("metaDescription") as string
        });
        alert("Szablon zaktualizowany");
      });
    } catch (error) {
      alert("Błąd przy aktualizacji szablonu");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Czy na pewno chcesz usunąć ten szablon? Działania nie można cofnąć."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTemplate(template.id);
      router.push("/settings/templates");
    } catch (error) {
      alert("Błąd przy usuwaniu szablonu");
      console.error(error);
      setIsDeleting(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Informacje podstawowe
          </h2>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nazwa szablonu
            </label>
            <Input
              id="name"
              name="name"
              defaultValue={template.name}
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
              defaultValue={template.description || ""}
              rows={2}
              disabled={isPending}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Typ treści
              </label>
              <select
                id="type"
                name="type"
                defaultValue={template.type}
                disabled
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              >
                <option value="WP_POST">📝 Blog (WordPress)</option>
                <option value="LINKEDIN_POST">📱 LinkedIn</option>
              </select>
            </div>

            <div>
              <label htmlFor="mainKeyword" className="block text-sm font-medium text-gray-700">
                Główne słowo kluczowe
              </label>
              <Input
                id="mainKeyword"
                name="mainKeyword"
                defaultValue={template.mainKeyword}
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
              Temat
            </label>
            <textarea
              id="topic"
              name="topic"
              defaultValue={template.topic}
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
              defaultValue={template.outline || ""}
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
              defaultValue={template.body || ""}
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
              Meta Title
            </label>
            <Input
              id="metaTitle"
              name="metaTitle"
              defaultValue={template.metaTitle || ""}
              disabled={isPending}
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700">
              Meta Description
            </label>
            <textarea
              id="metaDescription"
              name="metaDescription"
              defaultValue={template.metaDescription || ""}
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
            {isPending ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={isPending || isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? "Usuwanie..." : "Usuń szablon"}
          </Button>
          <Button
            type="button"
            onClick={() => window.history.back()}
            variant="ghost"
            disabled={isPending || isDeleting}
          >
            Anuluj
          </Button>
        </div>
      </form>
    </Card>
  );
}
