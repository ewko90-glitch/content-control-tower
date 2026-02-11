"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ContentPowerBarProps {
  view: string;
  statusFilter: string;
  typeFilter: string;
  searchQuery: string;
  totalCount: number;
}

export function ContentPowerBar({
  view,
  statusFilter,
  typeFilter,
  searchQuery,
  totalCount
}: ContentPowerBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    router.push(`/content?${params.toString()}`);
  };

  const toggleView = (newView: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("view", newView);
    router.push(`/content?${params.toString()}`);
  };

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/content?${params.toString()}`);
  };

  // Status label helper intentionally removed (unused) to satisfy lint rules

  return (
    <div className="flex flex-col gap-4 lg:gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 min-w-0">
        <input
          type="text"
          placeholder="Szukaj po temacie / słowie kluczowym…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      {/* View Switch */}
      <div className="flex gap-2">
        <button
          onClick={() => toggleView("kanban")}
          className={`px-3 py-2 rounded-md text-sm font-medium transition ${
            view === "kanban"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Kanban
        </button>
        <button
          onClick={() => toggleView("list")}
          className={`px-3 py-2 rounded-md text-sm font-medium transition ${
            view === "list"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Lista
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setFilter("type", e.target.value)}
          className="px-3 py-2 rounded-md border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Wszystkie typy</option>
          <option value="WP_POST">WordPress</option>
          <option value="LINKEDIN_POST">LinkedIn</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setFilter("status", e.target.value)}
          className="px-3 py-2 rounded-md border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Wszystkie statusy</option>
          <option value="DRAFT">Szkice</option>
          <option value="AWAITING_APPROVAL">Do zatwierdzenia</option>
          <option value="APPROVED">Zatwierdzone</option>
          <option value="SCHEDULED">Zaplanowane</option>
          <option value="PUBLISHED">Opublikowane</option>
          <option value="REJECTED">Odrzucone</option>
        </select>
      </div>

      {/* Add Content Button */}
      <Link href="/content/new">
        <Button>Dodaj treść</Button>
      </Link>

      {/* Counter */}
      <div className="text-sm text-gray-600 whitespace-nowrap">
        Razem: <strong>{totalCount}</strong>
      </div>
    </div>
  );
}
