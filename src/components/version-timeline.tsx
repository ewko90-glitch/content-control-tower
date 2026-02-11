"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

interface Version {
  id: string;
  version: number;
  title: string;
  body: string;
  metaTitle: string;
  metaDescription: string;
  createdAt: Date;
  createdBy?: { id: string; name: string; email: string };
  outline?: string;
}

interface VersionTimelineProps {
  versions: Version[];
  onSelectVersion: (version: Version) => void;
  selectedVersion?: Version;
}

export function VersionTimeline({
  versions,
  onSelectVersion,
  selectedVersion
}: VersionTimelineProps) {
  const sorted = [...versions].sort((a, b) => b.version - a.version);

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">Version History</h3>
      <div className="relative">
        {sorted.map((version, idx) => (
          <div key={version.id} className="flex gap-4 mb-4 last:mb-0">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => onSelectVersion(version)}
                className={`w-4 h-4 rounded-full transition border-2 ${
                  selectedVersion?.id === version.id
                    ? "bg-purple-500 border-purple-500"
                    : "bg-white border-gray-300 hover:border-purple-300"
                }`}
              />
              {idx < sorted.length - 1 && (
                <div className="w-0.5 h-12 bg-gray-200 mt-2" />
              )}
            </div>

            {/* Version info */}
            <button
              onClick={() => onSelectVersion(version)}
              className={`flex-1 text-left px-3 py-2 rounded-lg transition ${
                selectedVersion?.id === version.id
                  ? "bg-purple-50 border border-purple-200"
                  : "hover:bg-gray-50 border border-transparent"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h4 className="font-semibold text-sm">v{version.version}</h4>
                <span className="text-xs text-gray-500">
                  {new Date(version.createdAt).toLocaleDateString("pl-PL", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>
              {version.createdBy && (
                <p className="text-xs text-gray-600 mt-0.5">
                  {version.createdBy.name || version.createdBy.email}
                </p>
              )}
              <p className="text-xs text-gray-600 mt-1 truncate">
                {version.title || "Untitled"}
              </p>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

interface VersionCompareProps {
  currentVersion: Version;
  previousVersion?: Version;
}

export function VersionCompare({ currentVersion, previousVersion }: VersionCompareProps) {
  const [activeTab, setActiveTab] = useState("content");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        {["content", "meta"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === tab
                ? "border-purple-500 text-purple-600"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            {tab === "content" ? "Content" : "SEO Metadata"}
          </button>
        ))}
      </div>

      <div className={activeTab === "content" ? "block" : "hidden"}>
        <DiffView
          label="Title"
          current={currentVersion.title}
          previous={previousVersion?.title}
        />
        <DiffView
          label="Body"
          current={currentVersion.body}
          previous={previousVersion?.body}
          isLarge
        />
        {currentVersion.outline && (
          <DiffView
            label="Outline"
            current={currentVersion.outline}
            previous={previousVersion?.outline}
            isLarge
          />
        )}
      </div>

      <div className={activeTab === "meta" ? "block" : "hidden"}>
        <DiffView
          label="Meta Title"
          current={currentVersion.metaTitle}
          previous={previousVersion?.metaTitle}
        />
        <DiffView
          label="Meta Description"
          current={currentVersion.metaDescription}
          previous={previousVersion?.metaDescription}
          isLarge
        />
      </div>
    </div>
  );
}

interface DiffViewProps {
  label: string;
  current: string;
  previous?: string;
  isLarge?: boolean;
}

function DiffView({ label, current, previous, isLarge }: DiffViewProps) {
  const hasChanged = current !== previous;

  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium mb-2">{label}</h4>
      <div className={`grid ${previous ? "grid-cols-2" : "grid-cols-1"} gap-4`}>
        {previous && (
          <Card className="p-3 bg-red-50 border-red-200">
            <p className="text-xs text-red-600 font-medium mb-2">Previous</p>
            <div className={`text-sm ${isLarge ? "max-h-48 overflow-y-auto" : ""}`}>
              <p className="whitespace-pre-wrap break-words text-gray-600">
                {previous || "(empty)"}
              </p>
            </div>
          </Card>
        )}
        <Card className={`p-3 ${hasChanged ? "bg-green-50 border-green-200" : ""}`}>
          <p className={`text-xs font-medium mb-2 ${hasChanged ? "text-green-600" : "text-gray-600"}`}>
            {previous ? "Current" : "Content"}
          </p>
          <div className={`text-sm ${isLarge ? "max-h-48 overflow-y-auto" : ""}`}>
            <p className="whitespace-pre-wrap break-words text-gray-700">
              {current || "(empty)"}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
