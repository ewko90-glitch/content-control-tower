import Link from "next/link";
import { requireWorkspace } from "@/lib/guards";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ContentPage() {
  await requireWorkspace();

  return (
    <AppShell>
      <div className="grid gap-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Treści</h1>
          <p className="mt-2 text-gray-600">Moduł tworzenia i zarządzania treściami</p>
        </div>

        <Card>
          <div className="py-12 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L9 21H3v-6L16.732 3.732z"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-gray-900">Treści — w budowie</h2>
            <p className="mt-2 text-gray-600">
              Ten moduł jest w przygotowaniu. Wkrótce będziesz mógł tutaj tworzyć, edytować i publikować artykuły.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              W tym miejscu pojawią się opcje do tworzenia treści, generowania postów, planowania publikacji i
              zarządzania wersjami.
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
