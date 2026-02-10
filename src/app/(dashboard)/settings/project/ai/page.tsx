import { Card } from "@/components/ui/card";

const AI_FEATURES = [
  {
    title: "Generowanie treści",
    description: "AI pomoże tworzyć pierwsze wersje treści zgodnie z zasadami projektu.",
    points: ["Szkice artykułów i landing pages", "Posty do social media", "Warianty nagłówków i opisów"],
    note: "Treści zawsze wymagają decyzji człowieka.",
    badge: "W planie"
  },
  {
    title: "Kontrola jakości",
    description: "Automatyczna weryfikacja jakości przed publikacją.",
    points: ["Checklisty jakościowe", "Wykrywanie braków i niespójności", "Wsparcie SEO i struktury treści"],
    badge: "W planie"
  },
  {
    title: "Planowanie i rekomendacje",
    description: "AI analizuje backlog i pomaga planować publikacje.",
    points: ["Rekomendacje tematów", "Optymalne terminy publikacji", "Priorytetyzacja treści"],
    badge: "W planie"
  },
  {
    title: "Asystent decyzyjny",
    description: "AI jako doradca, nie autonomiczny autor.",
    points: ["Explainability (dlaczego taka sugestia)", "Pełna decyzyjność po stronie zespołu"],
    badge: "Filozofia produktu"
  }
];

export default function ProjectAiPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">AI w Content Control Tower</h2>
          <p className="mt-1 text-sm text-gray-600">
            Sztuczna inteligencja wspiera planowanie, tworzenie i kontrolę jakości treści.
          </p>
          <p className="text-sm text-gray-600">
            Zawsze pod pełną kontrolą zespołu - bez autonomicznej publikacji.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700">
              Wkrótce
            </span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
              Dostępne w wyższych pakietach
            </span>
          </div>
          <p className="text-xs text-gray-500">AI nie zastępuje zespołu. Pomaga podejmować lepsze decyzje.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {AI_FEATURES.map((feature) => (
          <Card key={feature.title} className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                {feature.badge}
              </span>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              {feature.points.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            {feature.note && <p className="text-xs text-gray-500">{feature.note}</p>}
          </Card>
        ))}
      </div>

      <Card className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Jak będzie działać dostęp do AI?</h3>
          <p className="text-sm text-gray-600">Przejrzyste zasady, bez ukrytych niespodzianek.</p>
        </div>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>AI będzie dostępne w wybranych pakietach.</li>
          <li>Limity AI będą zależne od planu, liczby użytkowników i intensywności użycia.</li>
          <li>AI nigdy nie publikuje treści automatycznie.</li>
          <li>Każda sugestia AI może zostać zaakceptowana, zmodyfikowana lub odrzucona.</li>
        </ul>
        <div className="flex items-center gap-2">
          <button
            disabled
            className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-400"
          >
            Porównaj pakiety AI
          </button>
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">Wkrótce</span>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Bezpieczeństwo i dane</h3>
            <p className="text-sm text-gray-600">AI działa tylko w granicach projektu.</p>
          </div>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Enterprise-ready
          </span>
        </div>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>Dane projektu nie uczą modeli publicznych.</li>
          <li>Dane są izolowane per workspace.</li>
          <li>AI działa wyłącznie w kontekście projektu.</li>
          <li>Każda rekomendacja AI może być audytowana.</li>
          <li>Administrator ma pełną kontrolę nad dostępem.</li>
        </ul>
      </Card>
    </div>
  );
}
