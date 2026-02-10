"use client";

import { useEffect, useState, useRef } from "react";
import type { Workspace } from "@prisma/client";
import { Button } from "./ui/button";

type Membership = {
  id: string;
  workspaceId: string;
  role: string;
  workspace: Workspace;
};

export function WorkspaceSwitcher({
  currentWorkspaceId
}: {
  currentWorkspaceId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleOpenDropdown = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && workspaces.length === 0) {
      setIsLoading(true);
      try {
        const res = await fetch("/api/workspaces/list");
        const data = await res.json();
        setWorkspaces(data.memberships || []);
      } catch (e) {
        console.error("Failed to fetch workspaces", e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSwitch = async (workspaceId: string) => {
    try {
      const res = await fetch("/api/workspaces/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId })
      });
      if (res.ok) {
        // Redirect to overview after switching workspace
        window.location.href = "/overview";
      }
    } catch (e) {
      console.error("Failed to switch workspace", e);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="secondary"
        onClick={handleOpenDropdown}
        className="inline-flex items-center gap-2"
        title="Click to switch workspace"
      >
        <span className="text-xs font-semibold">Switch</span>
        <span className="text-xs">▼</span>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 rounded-md border bg-white shadow-lg z-50">
          <div className="p-2">
            <div className="px-3 py-1 text-xs text-gray-500 font-semibold">Workspaces</div>
            {isLoading ? (
              <div className="px-3 py-2 text-xs text-gray-400">Loading...</div>
            ) : workspaces.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400">No workspaces</div>
            ) : (
              workspaces.map((membership) => (
                <button
                  key={membership.id}
                  onClick={() => handleSwitch(membership.workspaceId)}
                  className={`w-full rounded px-3 py-2 text-sm text-left transition ${
                    membership.workspaceId === currentWorkspaceId
                      ? "bg-blue-100 text-blue-900 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div>{membership.workspace.name}</div>
                  <div className="text-xs text-gray-500">{membership.role}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
