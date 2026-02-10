"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addSite, type SiteState } from "@/app/actions/sites";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { CopyUrlButton } from "@/components/copy-url-button";

export type SiteIntegrationStatus = "configured" | "needs_config" | "na";

export type SiteSummary = {
  id: string;
  name: string;
  baseUrl: string;
  type: "WORDPRESS" | "SHOPIFY" | "OTHER";
  status: "ACTIVE" | "INACTIVE";
  integrationStatus: SiteIntegrationStatus;
};

type SettingsSitesOverviewProps = {
  sites: SiteSummary[];
  total: number;
  configured: number;
  needsConfig: number;
  inactive: number;
  limit: number;
};

type FilterKey = "all" | "configured" | "needs_config" | "inactive";

const TYPE_LABELS: Record<SiteSummary["type"], string> = {
  WORDPRESS: "WordPress",
  SHOPIFY: "Shopify",
  OTHER: "Inne"
};

const STATUS_LABELS: Record<SiteSummary["status"], string> = {
  ACTIVE: "Aktywna",
  INACTIVE: "Nieaktywna"
};

const INTEGRATION_LABELS: Record<SiteIntegrationStatus, string> = {
  configured: "Skonfigurowano",
  needs_config: "Wymaga konfiguracji",
  na: "-"
};

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function SettingsSitesOverview({
  sites,
  total,
  configured,
  needsConfig,
  inactive,
  limit
}: SettingsSitesOverviewProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [state, setState] = useState<SiteState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    name: "",
    type: "WORDPRESS",
    baseUrl: "",
    notes: ""
  });

  const seatsFull = total >= limit;

  const quickStatus = total === 0
    ? "Brak konfiguracji"
    : needsConfig > 0
      ? "Wymaga uwagi"
      : "Gotowe do publikacji";

  const filteredSites = useMemo(() => {
    if (filter === "all") return sites;
    if (filter === "inactive") return sites.filter((site) => site.status === "INACTIVE");
    if (filter === "configured") return sites.filter((site) => site.integrationStatus === "configured");
    if (filter === "needs_config") return sites.filter((site) => site.integrationStatus === "needs_config");
    return sites;
  }, [filter, sites]);

  const handleFilter = (nextFilter: FilterKey) => {
    setFilter(nextFilter);
    const section = document.getElementById("sites-list");
    section?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScrollToQuickAdd = () => {
    const section = document.getElementById("quick-add");
    section?.scrollIntoView({ behavior: "smooth" });
  };

  const handleChange = (field: "name" | "type" | "baseUrl" | "notes", value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setState(null);

    if (seatsFull) {
      setState({ success: false, message: "Limit stron w planie. Zmień plan, aby dodać kolejne." });
      return;
    }

    const name = formValues.name.trim();
    const baseUrl = normalizeUrl(formValues.baseUrl);

    if (!name) {
      setState({ success: false, message: "Nazwa strony jest wymagana." });
      return;
    }

    if (!baseUrl || !isValidUrl(baseUrl)) {
      setState({ success: false, message: "Adres strony musi być poprawnym URL." });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("type", formValues.type);
    formData.append("baseUrl", baseUrl);
    formData.append("status", "ACTIVE");
    if (formValues.notes.trim()) {
      formData.append("notes", formValues.notes.trim());
    }

    const result = await addSite({ success: false }, formData);
    setState(result);
    setIsSubmitting(false);

    if (result.success) {
      setFormValues({ name: "", type: "WORDPRESS", baseUrl: "", notes: "" });
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Strony</h2>
          <p className="mt-1 text-sm text-gray-600">
            Miejsca, gdzie publikujesz treści (WordPress, Shopify i inne).
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              Strony: {total} / {limit}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                quickStatus === "Gotowe do publikacji"
                  ? "bg-green-100 text-green-700"
                  : quickStatus === "Wymaga uwagi"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-200 text-gray-700"
              }`}
            >
              {quickStatus}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button disabled={seatsFull} onClick={handleScrollToQuickAdd}>
              Dodaj stronę
            </Button>
            <Link href="/settings/project/plan" className="text-xs text-blue-600 hover:text-blue-700">
              Zwiększ limit
            </Link>
            <Link href="/sites" className="text-xs text-gray-600 hover:text-gray-900">
              Otwórz moduł Strony
            </Link>
          </div>
          {seatsFull && (
            <p className="text-xs text-amber-700">Limit stron w planie. Zmień plan, aby dodać kolejne.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-2">
          <p className="text-xs font-semibold uppercase text-gray-500">Skonfigurowane</p>
          <p className="text-3xl font-semibold text-gray-900">{configured}</p>
          <p className="text-xs text-gray-500">Strony gotowe do publikacji.</p>
          <button
            type="button"
            onClick={() => handleFilter("configured")}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Pokaż
          </button>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs font-semibold uppercase text-gray-500">Wymaga konfiguracji</p>
          <p className="text-3xl font-semibold text-gray-900">{needsConfig}</p>
          <p className="text-xs text-gray-500">Brakuje danych integracji.</p>
          <button
            type="button"
            onClick={() => handleFilter("needs_config")}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Pokaż
          </button>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs font-semibold uppercase text-gray-500">Nieaktywne</p>
          <p className="text-3xl font-semibold text-gray-900">{inactive}</p>
          <p className="text-xs text-gray-500">Wyłączone w tym projekcie.</p>
          <button
            type="button"
            onClick={() => handleFilter("inactive")}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Pokaż
          </button>
        </Card>
      </div>

      {total === 0 ? (
        <Card className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Zacznij od dodania pierwszej strony</h3>
            <p className="text-sm text-gray-600">Szybki onboarding, aby uruchomić publikacje.</p>
          </div>
          <ol className="space-y-2 text-sm text-gray-600">
            <li>1. Dodaj stronę (WordPress, Shopify lub inne).</li>
            <li>2. Skonfiguruj integrację, jeśli chcesz publikować automatycznie.</li>
            <li>3. Utwórz pierwszą treść i zaplanuj publikację.</li>
          </ol>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/sites">
              <Button>Dodaj stronę</Button>
            </Link>
            <Button disabled variant="secondary">
              Zobacz przykładową konfigurację
            </Button>
          </div>
        </Card>
      ) : needsConfig > 0 ? (
        <Card className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Dokończ konfigurację integracji</h3>
            <p className="text-sm text-gray-600">
              Niektóre strony nie mają danych dostępowych - publikacja automatyczna będzie niedostępna.
            </p>
          </div>
          <Link href="/sites">
            <Button variant="secondary">Przejdź do konfiguracji w module Strony</Button>
          </Link>
        </Card>
      ) : (
        <Card className="space-y-3">
          <h3 className="text-base font-semibold text-gray-900">Wszystkie strony są gotowe</h3>
          <p className="text-sm text-gray-600">Możesz planować publikacje i monitorować statusy.</p>
        </Card>
      )}

      <div id="sites-list">
        <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Lista stron</h3>
            <p className="text-sm text-gray-600">Szybki podgląd stanu publikacji i integracji.</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-full px-3 py-1 ${filter === "all" ? "bg-gray-200 text-gray-800" : "text-gray-500"}`}
            >
              Wszystkie
            </button>
            <button
              type="button"
              onClick={() => setFilter("configured")}
              className={`rounded-full px-3 py-1 ${filter === "configured" ? "bg-gray-200 text-gray-800" : "text-gray-500"}`}
            >
              Skonfigurowane
            </button>
            <button
              type="button"
              onClick={() => setFilter("needs_config")}
              className={`rounded-full px-3 py-1 ${filter === "needs_config" ? "bg-gray-200 text-gray-800" : "text-gray-500"}`}
            >
              Wymaga konfiguracji
            </button>
            <button
              type="button"
              onClick={() => setFilter("inactive")}
              className={`rounded-full px-3 py-1 ${filter === "inactive" ? "bg-gray-200 text-gray-800" : "text-gray-500"}`}
            >
              Nieaktywne
            </button>
          </div>
        </div>

        {filteredSites.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            Brak stron dla wybranego filtra.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Nazwa</th>
                  <th className="px-3 py-2">Typ</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Stan integracji</th>
                  <th className="px-3 py-2 text-right">Szybkie akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSites.map((site) => (
                  <tr key={site.id}>
                    <td className="px-3 py-3">
                      <p className="font-medium text-gray-900">{site.name}</p>
                      <p className="text-xs text-gray-500">{site.baseUrl}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        {TYPE_LABELS[site.type]}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        {STATUS_LABELS[site.status]}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        {INTEGRATION_LABELS[site.integrationStatus]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {site.integrationStatus === "needs_config" && site.type !== "OTHER" && (
                          <Link href="/sites" className="text-xs text-blue-600 hover:text-blue-700">
                            Konfiguruj
                          </Link>
                        )}
                        <Link href="/sites" className="text-xs text-blue-600 hover:text-blue-700">
                          Edytuj
                        </Link>
                        <CopyUrlButton value={site.baseUrl} className="text-xs" />
                        <Button disabled variant="ghost" className="text-xs">
                          Usuń
                        </Button>
                        <Button disabled variant="ghost" className="text-xs">
                          Aktywuj lub dezaktywuj
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </Card>
      </div>

      <div id="quick-add">
        <Card className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Dodaj nową stronę</h3>
            <p className="text-sm text-gray-600">Szybkie dodanie bez przechodzenia do modułu.</p>
          </div>

        {state?.message && (
          <Alert variant={state.success ? "success" : "error"}>
            {state.message}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Nazwa</label>
            <Input
              value={formValues.name}
              onChange={(event) => handleChange("name", event.target.value)}
              placeholder="Np. Sklep Glow"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Typ</label>
            <Select
              value={formValues.type}
              onChange={(event) => handleChange("type", event.target.value)}
            >
              <option value="WORDPRESS">WordPress</option>
              <option value="SHOPIFY">Shopify</option>
              <option value="OTHER">Inne</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Base URL</label>
            <Input
              value={formValues.baseUrl}
              onChange={(event) => handleChange("baseUrl", event.target.value)}
              placeholder="np. https://twojastrona.pl"
            />
            <p className="text-xs text-gray-500">Podaj pełny adres, np. https://twojastrona.pl</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Notatki (opcjonalnie)</label>
            <Input
              value={formValues.notes}
              onChange={(event) => handleChange("notes", event.target.value)}
              placeholder="np. integracja w toku"
            />
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={isSubmitting || seatsFull}>
              {isSubmitting ? "Dodawanie..." : "Dodaj stronę"}
            </Button>
            <Link href="/sites" className="text-sm text-blue-600 hover:text-blue-700">
              Dodaj w module Strony
            </Link>
            {seatsFull && (
              <span className="text-xs text-amber-700">Limit stron w planie. Zmień plan, aby dodać kolejne.</span>
            )}
          </div>
        </form>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Dobre praktyki</h3>
            <p className="text-sm text-gray-600">Utrzymuj porządek i łatwiejsze raportowanie.</p>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>Dodaj osobne strony dla różnych marek lub sklepów.</li>
            <li>Używaj statusu "Nieaktywna", gdy integracja jest tymczasowo wyłączona.</li>
            <li>Skonfiguruj integrację, aby publikacja działała bez ręcznego kopiowania.</li>
          </ul>
        </Card>
        <Card className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Najczęstsze problemy</h3>
            <p className="text-sm text-gray-600">Szybka checklista przed konfiguracją.</p>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>Błędny adres strony (base URL) - sprawdź https://</li>
            <li>Brak danych integracji - publikacja automatyczna będzie zablokowana</li>
            <li>Token lub hasło wygasło - odśwież dane w konfiguracji</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
