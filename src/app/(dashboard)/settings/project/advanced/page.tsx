import { Card } from "@/components/ui/card";

export default function ProjectAdvancedPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">Zaawansowane</h2>
        <p className="text-sm text-gray-600">
          Ustawienia techniczne, administracyjne i bezpieczeństwa projektu.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Bezpieczeństwo</h3>
              <p className="text-sm text-gray-600">Podstawy ochrony danych są zawsze aktywne.</p>
            </div>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Aktywne
            </span>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>Izolacja danych per projekt (workspace).</li>
            <li>Kontrola dostępu oparta o role.</li>
            <li>Bezpieczne operacje (soft-delete, walidacje).</li>
            <li>Historia zmian i działań.</li>
          </ul>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Audyt i zgodność</h3>
              <p className="text-sm text-gray-600">Przygotowane pod audyty i wymogi korporacyjne.</p>
            </div>
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">Wkrótce</span>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>Wszystkie kluczowe działania są zapisywane.</li>
            <li>Administrator ma wgląd w historię zmian.</li>
            <li>Przygotowane pod Enterprise i audyty wewnętrzne.</li>
          </ul>
          <button
            disabled
            className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-400"
          >
            Zobacz logi audytu
          </button>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Integracje i API</h3>
              <p className="text-sm text-gray-600">Rozszerzaj system o zewnętrzne narzędzia.</p>
            </div>
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">W planie</span>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>Public API (read / write).</li>
            <li>Webhooki publikacji.</li>
            <li>Integracje z zewnętrznymi systemami (CMS, BI, marketing).</li>
          </ul>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Zarządzanie projektem</h3>
              <p className="text-sm text-gray-600">Operacje administracyjne i bezpieczeństwa.</p>
            </div>
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">Wkrótce</span>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>Eksport danych projektu.</li>
            <li>Transfer projektu między organizacjami.</li>
            <li>Archiwizacja i przywracanie projektu.</li>
          </ul>
          <button
            disabled
            className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-400"
          >
            Zarządzaj projektem
          </button>
        </Card>
      </div>
    </div>
  );
}
