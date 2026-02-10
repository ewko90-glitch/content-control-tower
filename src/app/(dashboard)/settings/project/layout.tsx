import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { SettingsProjectShell } from "@/components/settings-project-shell";

export default function ProjectSettingsLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <SettingsProjectShell>{children}</SettingsProjectShell>
    </AppShell>
  );
}
