"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ContentVersion {
  id: string;
  version: number;
  title: string;
  metaTitle?: string;
  createdAt: Date;
}

interface VersionsSidebarProps {
  versions: ContentVersion[];
  currentVersion: number;
  onRevert?: (versionId: string) => Promise<void>;
  isLoading?: boolean;
}

export function VersionsSidebar({
  versions,
  currentVersion,
  onRevert,
  isLoading = false
}: VersionsSidebarProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!versions || versions.length === 0) {
    return (
      <Card className="p-4 text-center text-sm text-gray-500">
        Brak wersji
      </Card>
    );
  }

  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

  return (
    <Card className="space-y-2">
      <h3 className="font-semibold text-gray-900 text-sm">Wersje treści</h3>
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {sortedVersions.map((version) => (
          <div
            key={version.id}
            className={`rounded-md border p-2 cursor-pointer transition ${
              currentVersion === version.version
                ? "bg-blue-50 border-blue-300"
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <button
              onClick={() =>
                setExpandedId(expandedId === version.id ? null : version.id)
              }
              className="w-full text-left flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-gray-900">
                  v{version.version}
                  {currentVersion === version.version && (
                    <span className="ml-2 text-blue-600">(Obecna)</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(version.createdAt).toLocaleDateString("pl-PL", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>
              <span className="text-xs text-gray-400">
                {expandedId === version.id ? "▼" : "▶"}
              </span>
            </button>

            {expandedId === version.id && (
              <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                <p className="text-xs text-gray-700">
                  <span className="font-medium">Tytuł:</span> {version.title}
                </p>
                {version.metaTitle && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Meta:</span> {version.metaTitle}
                  </p>
                )}
                {currentVersion !== version.version && onRevert && (
                  <button
                    onClick={() => onRevert(version.id)}
                    disabled={isLoading}
                    className="w-full text-xs mt-2 px-2 py-1 rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition"
                  >
                    Przywróć tę wersję
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
