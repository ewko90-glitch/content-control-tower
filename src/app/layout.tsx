import type { ReactNode } from "react";
import "./globals.css";
import "./(dashboard)/calendar/calendar-custom.css";

export const metadata = {
  title: "Content Control Tower",
  description: "Multi-tenant content planning and publishing"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
