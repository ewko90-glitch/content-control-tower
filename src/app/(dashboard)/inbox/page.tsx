import Link from "next/link";
import { requireWorkspace } from "@/lib/guards";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function InboxPage() {
  await requireWorkspace();

  return (
    <AppShell>
      <div className="grid gap-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Do sprawdzenia</h1>
          <p className="mt-2 text-gray-600">Pendencies, zatwierdzenia i decyzje czekające na Ciebie</p>
        </div>

        <Card>
          <div className="py-12 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-gray-900">Do sprawdzenia — w budowie</h2>
            <p className="mt-2 text-gray-600">
              Ten moduł jest w przygotowaniu. Wkrótce pojawią się tutaj treści czekające na decyzje i zatwierdzenia.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              W tym miejscu zobaczysz powiadomienia, zadania wymagające działania, komentarze i decyzje od zespołu.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href="/overview">
                <Button variant="secondary">Wróć do Przeglądu</Button>
              </Link>
              <Link href="/domains">
                <Button variant="ghost">Przejdź do Domen</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
