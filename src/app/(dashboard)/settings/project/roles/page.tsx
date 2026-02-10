import { Card } from "@/components/ui/card";

const roles = [
  {
    title: "Administrator",
    badge: "Pełny dostęp",
    description: "Pełna kontrola nad projektem, zespołem i ustawieniami.",
    permissions: [
      "Zarządzanie zespołem i rolami",
      "Zarządzanie planem i limitami",
      "Dodawanie i usuwanie stron",
      "Publikowanie treści",
      "Dostęp do audytu i historii zmian"
    ],
    note: "Projekt musi mieć co najmniej jednego administratora."
  },
  {
    title: "Manager",
    badge: "Zarządzanie treściami",
    description: "Zarządza treściami i procesem publikacji.",
    permissions: [
      "Tworzenie i edycja treści",
      "Zatwierdzanie treści",
      "Planowanie publikacji",
      "Podgląd zespołu (bez zarządzania)"
    ],
    limitations: [
      "Brak dostępu do planu i limitów",
      "Brak możliwości usuwania projektu"
    ]
  },
  {
    title: "Redaktor",
    badge: "Tworzenie treści",
    description: "Tworzy i edytuje treści w projekcie.",
    permissions: [
      "Tworzenie wersji treści",
      "Edycja własnych treści",
      "Podgląd statusów publikacji"
    ],
    limitations: ["Brak zatwierdzania", "Brak publikacji", "Brak dostępu do ustawień"]
  },
  {
    title: "Podgląd",
    badge: "Wkrótce",
    description: "Dostęp tylko do podglądu danych i treści.",
    permissions: ["Podgląd treści i statusów", "Brak edycji"],
    comingSoon: true
  }
];

export default function ProjectRolesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">Role i dostęp</h2>
        <p className="text-sm text-gray-600">
          Zobacz, jakie uprawnienia mają poszczególne role w projekcie.
        </p>
        <p className="text-xs text-gray-500">
          Role określają dostęp do treści, publikacji i ustawień projektu.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.title} className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{role.title}</h3>
                <p className="text-sm text-gray-600">{role.description}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  role.comingSoon ? "bg-gray-200 text-gray-600" : "bg-blue-100 text-blue-700"
                }`}
              >
                {role.badge}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Uprawnienia</p>
              <ul className="mt-2 space-y-2 text-sm text-gray-700">
                {role.permissions.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                    <span className={role.comingSoon ? "text-gray-400" : undefined}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {role.limitations && (
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Ograniczenia</p>
                <ul className="mt-2 space-y-2 text-sm text-gray-600">
                  {role.limitations.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {role.note && <p className="text-xs text-gray-500">{role.note}</p>}

            {role.comingSoon && (
              <button
                disabled
                className="w-full rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-400"
              >
                Dostępne wkrótce
              </button>
            )}
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Jak działają role?</h3>
            <p className="text-sm text-gray-600">Kilka zasad, które warto znać.</p>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>Role są przypisywane do projektu (workspace).</li>
            <li>Jedna osoba może mieć różne role w różnych projektach.</li>
            <li>Uprawnienia są sprawdzane przy każdej akcji.</li>
            <li>Wszystkie działania są zapisywane w historii (audyt).</li>
          </ul>
        </Card>

        <Card className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Planowane rozszerzenia</h3>
            <p className="text-sm text-gray-600">Rozwój modelu ról w kolejnych etapach.</p>
          </div>
          <div className="space-y-2">
            {[
              "Własne role (Enterprise)",
              "Dostęp tylko do wybranych sekcji",
              "Tymczasowy dostęp (np. audytor)"
            ].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-md border border-dashed border-gray-200 px-3 py-2 text-sm">
                <span className="text-gray-700">{item}</span>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] text-gray-600">
                  W planie
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
