import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContentCreateForm } from "@/components/content-create-form";
import { requireRole } from "@/lib/guards";

export default async function ContentNewPage() {
  await requireRole("EDITOR");

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <Link href="/content" className="text-xs text-blue-600 hover:underline">
            ← Wróć do treści
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Dodaj treść</h1>
          <p className="mt-2 text-base text-gray-600">
            Utwórz nową treść, którą będziesz mógł edytować i wysłać do zatwierdzenia.
          </p>
        </div>

        {/* Form Card */}
        <Card className="space-y-6">
          <ContentCreateForm />
        </Card>

        {/* Info Box */}
        <Card className="bg-blue-50 border-l-4 border-l-blue-500 space-y-3">
          <h3 className="font-semibold text-gray-900">Jak to działa</h3>
          <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
            <li>Wypełnij podstawowe dane (temat, typ, słowo kluczowe)</li>
            <li>Treść zostanie utworzona w statusie „Szkic"</li>
            <li>Możesz ją edytować, generować wersje i wysłać do zatwierdzenia</li>
            <li>Po zatwierdzeniu zaplanuj datę publikacji</li>
          </ol>
        </Card>
      </div>
    </AppShell>
  );
}
