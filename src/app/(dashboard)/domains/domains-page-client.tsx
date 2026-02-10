"use client";

import { useState, useMemo } from "react";
import type { Domain } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DomainModal } from "@/components/domain-modal";
import { DomainRow } from "@/components/domain-row";

type Props = {
  initialDomains: Domain[];
};

export function DomainsPageClient({ initialDomains }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);

  // Client-side filtering
  const filteredDomains = useMemo(() => {
    if (!searchQuery) return initialDomains;
    const query = searchQuery.toLowerCase();
    return initialDomains.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        (d.slug?.toLowerCase() || "").includes(query) ||
        (d.description?.toLowerCase() || "").includes(query)
    );
  }, [initialDomains, searchQuery]);

  const handleOpenCreate = () => {
    setEditingDomain(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (domain: Domain) => {
    setEditingDomain(domain);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingDomain(null);
    setModalOpen(false);
  };

  const handleSuccess = () => {
    // Re-fetch domains from server
    window.location.reload();
  };

  if (domains.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">Brak domen</h3>
        <p className="mt-1 text-sm text-gray-600">
          Dodaj pierwszą domenę, aby zacząć porządkować treści w tym projekcie.
        </p>
        <Button onClick={handleOpenCreate} className="mt-6">
          Dodaj domenę
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Szukaj po nazwie, identyfikatorze lub opisie..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <Button onClick={handleOpenCreate} variant="primary">
          + Dodaj domenę
        </Button>
      </div>

      {filteredDomains.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          <p>Brak wyników dla &quot;{searchQuery}&quot;</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Nazwa</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Opis</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredDomains.map((domain) => (
                <DomainRow key={domain.id} domain={domain} onEdit={handleOpenEdit} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DomainModal
        domain={editingDomain}
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
