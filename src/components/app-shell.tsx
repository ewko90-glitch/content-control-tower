import Link from "next/link";
import { ReactNode } from "react";
import { getActiveWorkspaceId } from "@/lib/guards";

const navItems = [
  { href: "/workspaces", label: "Workspaces" },
  { href: "/domains", label: "Domains" },
  { href: "/content", label: "Content" },
  { href: "/calendar", label: "Calendar" },
  { href: "/inbox", label: "Inbox" }
];

export function AppShell({ children }: { children: ReactNode }) {
  const workspaceId = getActiveWorkspaceId();
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-semibold">Content Control Tower</p>
            <p className="text-xs text-gray-500">Workspace: {workspaceId ?? "none"}</p>
          </div>
          <nav className="flex gap-4 text-sm">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-gray-600 hover:text-gray-900">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
