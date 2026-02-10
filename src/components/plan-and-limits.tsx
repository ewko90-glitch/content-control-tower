"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BillingCycle, PlanKey, PlanLimits } from "@/lib/plan-placeholder";

const PLAN_LABELS: Record<PlanKey, string> = {
  starter: "Starter",
  growth: "Growth",
  control_tower: "Control Tower",
  enterprise: "Enterprise"
};

const PLAN_DESCRIPTIONS: Record<PlanKey, string> = {
  starter: "Dla małych zespołów i startu procesu contentowego.",
  growth: "Dla rosnących zespołów z regularnym publikowaniem.",
  control_tower: "Dla zespołów, które chcą pełnej kontroli procesu.",
  enterprise: "Dla dużych organizacji i indywidualnych wymagań."
};

type PlanAndLimitsProps = {
  planKey: PlanKey;
  defaultCycle: BillingCycle;
  limits: PlanLimits;
  membersCount: number;
  sitesCount: number;
  domainsCount: number;
  contentCount?: number | null;
};

type PlanCard = {
  key: PlanKey;
  badge?: string;
  summary: string[];
  limits: PlanLimits;
  aiLabel: string;
  cta: string;
};

const PLAN_CARDS: PlanCard[] = [
  {
    key: "starter",
    summary: ["5 miejsc", "3 strony", "5 domen"],
    limits: { seats: 5, sites: 3, domains: 5, aiTier: "none" },
    aiLabel: "Nie",
    cta: "Rozpocznij okres próbny"
  },
  {
    key: "growth",
    summary: ["10 miejsc", "8 stron", "12 domen"],
    limits: { seats: 10, sites: 8, domains: 12, aiTier: "basic" },
    aiLabel: "Podstawowe",
    cta: "Rozpocznij okres próbny"
  },
  {
    key: "control_tower",
    badge: "Popularny",
    summary: ["20 miejsc", "20 stron", "30 domen"],
    limits: { seats: 20, sites: 20, domains: 30, aiTier: "advanced" },
    aiLabel: "Zaawansowane",
    cta: "Rozpocznij okres próbny"
  },
  {
    key: "enterprise",
    summary: ["50 miejsc", "100 stron", "200 domen"],
    limits: { seats: 50, sites: 100, domains: 200, aiTier: "advanced" },
    aiLabel: "Zaawansowane",
    cta: "Umów demo"
  }
];

export function PlanAndLimits({
  planKey,
  defaultCycle,
  limits,
  membersCount,
  sitesCount,
  domainsCount,
  contentCount
}: PlanAndLimitsProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(defaultCycle);

  const cycleLabel = billingCycle === "yearly" ? "Roczne" : "Miesięczne";

  const usageRows = useMemo(() => {
    const seatsRemaining = Math.max(limits.seats - membersCount, 0);
    const sitesRemaining = Math.max(limits.sites - sitesCount, 0);
    const domainsRemaining = Math.max(limits.domains - domainsCount, 0);

    return [
      {
        label: "Użytkownicy (miejsca)",
        used: membersCount,
        limit: limits.seats,
        helper:
          membersCount < limits.seats
            ? `Możesz dodać jeszcze ${seatsRemaining} osób.`
            : "Osiągnięto limit miejsc. Dodawanie nowych osób jest zablokowane. Zwiększ limit w wyższym planie.",
        cta: membersCount < limits.seats ? "Dokup miejsce" : "Zwiększ limit",
        note: "W przyszłości: dokupienie miejsca bez zmiany planu.",
        status:
          membersCount >= limits.seats
            ? "limit"
            : membersCount >= Math.ceil(limits.seats * 0.8)
              ? "warning"
              : "ok",
        href: "#plans"
      },
      {
        label: "Strony do publikacji",
        used: sitesCount,
        limit: limits.sites,
        helper:
          sitesCount < limits.sites
            ? `Pozostało ${sitesRemaining} miejsc publikacji. Każda strona to osobne miejsce.`
            : "Osiągnięto limit miejsc publikacji. Dodawanie nowych stron jest zablokowane. Zwiększ limit w wyższym planie.",
        cta: sitesCount === 0 ? "Dodaj pierwszą stronę" : sitesCount >= limits.sites ? "Zwiększ limit" : "Dokup miejsce",
        status:
          sitesCount >= limits.sites
            ? "limit"
            : sitesCount >= Math.ceil(limits.sites * 0.8)
              ? "warning"
              : "ok",
        href: sitesCount === 0 ? "/sites" : "#plans"
      },
      {
        label: "Domeny",
        used: domainsCount,
        limit: limits.domains,
        helper:
          domainsCount < limits.domains
            ? `Pozostało ${domainsRemaining} domen. Domeny pomagają porządkować content i SEO.`
            : "Osiągnięto limit domen. Dodawanie nowych domen jest zablokowane. Zwiększ limit w wyższym planie.",
        cta: domainsCount === 0 ? "Dodaj domenę" : domainsCount >= limits.domains ? "Zwiększ limit" : "Dokup miejsce",
        status:
          domainsCount >= limits.domains
            ? "limit"
            : domainsCount >= Math.ceil(limits.domains * 0.8)
              ? "warning"
              : "ok",
        href: domainsCount === 0 ? "/domains" : "#plans"
      },
      {
        label: "AI",
        used: 0,
        limit: 1,
        helper: "Niedostępne w tym planie. AI będzie wspierać generowanie treści i kontrolę jakości.",
        cta: "Odblokuj w wyższym planie",
        status: "locked",
        disabled: true,
        href: "#plans"
      }
    ];
  }, [membersCount, sitesCount, domainsCount, limits]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Plan i limity</h2>
          <p className="mt-1 text-sm text-gray-600">
            Kontroluj zasoby projektu i rozwijaj plan bez ryzyka utraty danych.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              Plan: {PLAN_LABELS[planKey]}
            </span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
              Rozliczenie: {cycleLabel}
            </span>
          </div>
          <p className="text-xs text-gray-500">Rocznie to najlepsza wartość.</p>
        </div>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Okres rozliczenia</h3>
            <p className="text-sm text-gray-600">Przełącz, aby zobaczyć komunikację cen i wartości.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 p-1 text-sm">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                billingCycle === "monthly" ? "bg-white text-gray-900" : "text-gray-500"
              }`}
            >
              Miesięcznie
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                billingCycle === "yearly" ? "bg-white text-gray-900" : "text-gray-500"
              }`}
            >
              Rocznie
            </button>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
              Najlepsza wartość
            </span>
          </div>
        </div>
      </Card>

      <Card className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Twój plan</p>
            <h3 className="text-lg font-semibold text-gray-900">{PLAN_LABELS[planKey]}</h3>
            <p className="text-sm text-gray-600">{PLAN_DESCRIPTIONS[planKey]}</p>
          </div>
          {planKey === "control_tower" && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
              Popularny
            </span>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-gray-500">W skrócie</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-500">Miejsca w zespole</p>
              <p className="text-lg font-semibold text-gray-900">{limits.seats}</p>
            </div>
            <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-500">Strony do publikacji</p>
              <p className="text-lg font-semibold text-gray-900">{limits.sites}</p>
            </div>
            <div className="sm:col-span-2 rounded-md border border-gray-100 bg-white px-3 py-2">
              <p className="text-xs text-gray-500">Domeny dla treści i SEO</p>
              <p className="text-sm font-medium text-gray-700">{limits.domains}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
          <Button disabled className="text-sm">
            Zmień plan
          </Button>
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
            Wkrótce
          </span>
          <Link href="#plans" className="text-sm text-blue-600 hover:text-blue-700">
            Zobacz wszystkie pakiety
          </Link>
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Wykorzystanie zasobów</h3>
          <p className="text-sm text-gray-600">Śledź limity i planuj rozwój projektu.</p>
        </div>
        <div className="space-y-4">
          {usageRows.map((row) => {
            const percent = Math.min(Math.round((row.used / row.limit) * 100), 100);
            const statusLabel =
              row.status === "limit"
                ? "Limit osiągnięty"
                : row.status === "warning"
                  ? "Blisko limitu"
                  : row.status === "locked"
                    ? "Wkrótce"
                    : "OK";
            const statusClass =
              row.status === "limit"
                ? "bg-red-100 text-red-700"
                : row.status === "warning"
                  ? "bg-amber-100 text-amber-700"
                  : row.status === "locked"
                    ? "bg-gray-200 text-gray-600"
                    : "bg-green-100 text-green-700";

            return (
              <div key={row.label} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{row.label}</p>
                    <p className="text-xs text-gray-500">{row.helper}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {row.status === "locked" ? "—" : `${row.used} / ${row.limit}`}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>

                {row.status !== "locked" && (
                  <div className="mt-3 h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${
                        row.status === "limit"
                          ? "bg-red-500"
                          : row.status === "warning"
                            ? "bg-amber-500"
                            : "bg-green-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}

                {row.note && <p className="mt-2 text-xs text-gray-500">{row.note}</p>}

                <div className="mt-3">
                  {row.disabled ? (
                    <Button disabled className="text-xs">
                      {row.cta}
                    </Button>
                  ) : (
                    <Link href={row.href} className="text-sm text-blue-600 hover:text-blue-700">
                      {row.cta} →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {typeof contentCount === "number" && (
          <p className="text-xs text-gray-500">
            Treści w projekcie: {contentCount}. Limity treści pojawią się w kolejnych etapach.
          </p>
        )}
      </Card>

      <Card className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Co się stanie po przekroczeniu limitu?</h3>
          <p className="text-sm text-gray-600">Spokojnie — dostęp do danych pozostaje bez zmian.</p>
        </div>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>Dane nie znikają i nic nie zostanie usunięte.</li>
          <li>Możesz nadal przeglądać i zarządzać tym co już istnieje.</li>
          <li>Zablokowane będzie tylko dodawanie nowych elementów ponad limit.</li>
          <li>Administrator zobaczy jasne komunikaty i propozycję rozwiązania.</li>
        </ul>
      </Card>

      <div id="plans" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Pakiety</h3>
            <p className="text-sm text-gray-600">Porównaj możliwości i wybierz plan dopasowany do zespołu.</p>
            <p className="text-xs text-gray-500">Wybrany okres: {cycleLabel}. Najlepsza wartość przy rozliczeniu rocznym.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 p-1 text-sm">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                billingCycle === "monthly" ? "bg-white text-gray-900" : "text-gray-500"
              }`}
            >
              Miesięcznie
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                billingCycle === "yearly" ? "bg-white text-gray-900" : "text-gray-500"
              }`}
            >
              Rocznie
            </button>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
              Oszczędzasz do X%
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {PLAN_CARDS.map((plan) => (
            <Card
              key={plan.key}
              className={`space-y-4 ${
                plan.badge ? "border-blue-200 bg-blue-50/40" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-base font-semibold text-gray-900">{PLAN_LABELS[plan.key]}</h4>
                  <p className="text-xs text-gray-600">{PLAN_DESCRIPTIONS[plan.key]}</p>
                </div>
                {plan.badge && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                    {plan.badge}
                  </span>
                )}
              </div>

              <div className="space-y-1 text-sm text-gray-700">
                <p>{plan.summary[0]}</p>
                <p>{plan.summary[1]}</p>
                <p>{plan.summary[2]}</p>
                <p className="text-xs text-gray-500">AI: {plan.aiLabel}</p>
              </div>

              <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
                <p>Funkcje premium są dostępne w wyższych planach.</p>
              </div>

              <Button disabled className="w-full text-xs">
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <Card className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Planowane rozszerzenia</h3>
          <p className="text-sm text-gray-600">Funkcje rozliczeniowe i rozbudowa planów.</p>
        </div>
        <div className="space-y-2">
          {[
            "Rozliczenia i faktury",
            "Historia płatności",
            "Dokupowanie miejsc (seats) bez zmiany planu",
            "Pakiety AI"
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
  );
}
