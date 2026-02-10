"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteModal } from "@/components/site-modal";
import { SiteRow } from "@/components/site-row";

interface Site {
  id: string;
  name: string;
  type: "WORDPRESS" | "SHOPIFY" | "OTHER";
  baseUrl: string;
  status: "ACTIVE" | "INACTIVE";
  notes: string | null;
  wpAdminUrl: string | null;
  wpUsername: string | null;
  shopifyShopDomain: string | null;
  updatedAt: Date;
}

interface SitesPageProps {
  sites: Site[];
}

export function SitesPageClient({ sites }: SitesPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const filteredSites = useMemo(
    () =>
      sites.filter(
        (site) =>
          site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.baseUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.type.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [sites, searchTerm]
  );

  const handleSiteAdded = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="grid gap-6">
      {/* Search and Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Szukaj stron
          </label>
          <Input
            placeholder="Wyszukaj po nazwie, adresie lub typie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <SiteModal
          key={refreshKey}
          trigger={<Button className="w-full sm:w-auto">+ Dodaj stronę</Button>}
          onClose={handleSiteAdded}
        />
      </div>

      {/* Sites List */}
      {filteredSites.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-gray-900">Brak stron</h2>
            <p className="mt-2 text-gray-600">
              Dodaj pierwszą stronę, aby później planować publikacje w konkretnych miejscach.
            </p>
            <div className="mt-8">
              <SiteModal
                trigger={<Button>Dodaj stronę</Button>}
                onClose={handleSiteAdded}
              />
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-900">Nazwa</th>
                  <th className="px-4 py-3 font-semibold text-gray-900">Typ</th>
                  <th className="px-4 py-3 font-semibold text-gray-900">Adres</th>
                  <th className="px-4 py-3 font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-900">
                    Ostatnia aktualizacja
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSites.map((site) => (
                  <SiteRow
                    key={site.id}
                    {...site}
                    onSiteDeleted={handleSiteAdded}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Aktywnych stron</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {sites.filter((s) => s.status === "ACTIVE").length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Razem stron</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{sites.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Typy</p>
            <p className="mt-2 text-sm text-gray-600">
              {new Set(sites.map((s) => s.type)).size > 0 ? (
                <span>
                  {Array.from(new Set(sites.map((s) => s.type)))
                    .map((type) => {
                      const labels: Record<string, string> = {
                        WORDPRESS: "WP",
                        SHOPIFY: "Shop",
                        OTHER: "Inne"
                      };
                      return labels[type] || type;
                    })
                    .join(", ")}
                </span>
              ) : (
                <span>—</span>
              )}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
