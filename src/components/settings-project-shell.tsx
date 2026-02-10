"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const tabs = [
  { href: "/settings/project/general", label: "Ogólne" },
  { href: "/settings/project/team", label: "Zespół" },
  { href: "/settings/project/roles", label: "Role i dostęp" },
  { href: "/settings/project/plan", label: "Plan i limity" },
  { href: "/settings/project/sites", label: "Strony" },
  { href: "/settings/project/ai", label: "AI", badge: "Wkrótce" },
  { href: "/settings/project/advanced", label: "Zaawansowane", badge: "Wkrótce" }
];

type SettingsProjectShellProps = {
  children: React.ReactNode;
};

export function SettingsProjectShell({ children }: SettingsProjectShellProps) {
  const pathname = usePathname();
  const activeTab = tabs.find((tab) => tab.href === pathname);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Ustawienia projektu</h1>
        <p className="mt-1 text-sm text-gray-600">
          Zarządzaj konfiguracją projektu, dostępami i kluczowymi ustawieniami.
        </p>
        {activeTab && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">Sekcja</span>
            <span className="font-medium text-gray-700">{activeTab.label}</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-xl border bg-white p-3">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={clsx(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition",
                    isActive
                      ? "bg-gray-100 font-medium text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                      {tab.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="rounded-xl border bg-white p-6">{children}</section>
      </div>
    </div>
  );
}
