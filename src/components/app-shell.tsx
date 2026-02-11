import Link from "next/link";
import { ReactNode } from "react";

const navItems = [
  { href: "/overview", label: "Przegląd" },
  { href: "/workspaces", label: "Workspaces" },
  { href: "/domains", label: "Domeny" },
  { href: "/sites", label: "Strony" },
  { href: "/content", label: "Treści" },
  { href: "/calendar", label: "Kalendarz" },
  { href: "/settings/project", label: "Ustawienia projektu" },
  { href: "/inbox", label: "Do sprawdzenia" }
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-lg font-semibold">Content Control Tower</p>
              <p className="text-xs text-gray-500">Workspace Management</p>
            </div>
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
