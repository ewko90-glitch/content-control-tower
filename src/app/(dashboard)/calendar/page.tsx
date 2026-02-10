import Link from "next/link";
import { requireWorkspace } from "@/lib/guards";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function CalendarPage() {
  await requireWorkspace();

  return (
    <AppShell>
      <div className="grid gap-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Kalendarz</h1>
          <p className="mt-2 text-gray-600">Plan publikacji i widok temporalny treści</p>
        </div>

        <Card>
          <div className="py-12 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
              <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-gray-900">Kalendarz — w budowie</h2>
            <p className="mt-2 text-gray-600">
              Ten moduł jest w przygotowaniu. Wkrótce będziesz mógł tutaj planować publikacje na osi czasu.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              W tym miejscu pojawią się widok tygodniowy, miesięczny i planowanie publikacji z automatycznym
              rozkładem treści.
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
