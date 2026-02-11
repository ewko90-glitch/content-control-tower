import React from "react";
import { requireWorkspace } from "@/lib/guards";
import { getInboxItems, InboxItem } from "@/lib/inbox";

export default async function InboxPage() {
  const { workspaceId } = await requireWorkspace();
  const items = await getInboxItems(workspaceId);

  const count = items.length;

  return (
    <main style={{ padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Do sprawdzenia</h1>
          <p>Rzeczy, które wymagają Twojej uwagi w projekcie.</p>
        </div>
        <div>
          <span style={{ padding: "6px 10px", borderRadius: 16, background: "#eee" }}>{count > 0 ? `${count} do sprawdzenia` : "Inbox pusty"}</span>
        </div>
      </header>

      <section style={{ marginTop: 20 }}>
        {count === 0 ? (
          <div>
            <h2>Wszystko jest pod kontrolą.</h2>
            <ul>
              <li>✔ Brak błędów publikacji</li>
              <li>✔ Brak treści do zatwierdzenia</li>
              <li>✔ Projekt gotowy do działania</li>
            </ul>
            <p><a href="/overview">Przejdź do Control Tower</a></p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {items.map((it) => (
              <Card key={it.id} item={it} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Card({ item }: { item: InboxItem }) {
  return (
    <article style={{ border: "1px solid #e5e7eb", padding: 12, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>{item.priority}</div>
        <h3 style={{ margin: "6px 0" }}>{item.title}</h3>
        <p style={{ margin: 0 }}>{item.description}</p>
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>Wykryto: {new Date(item.detectedAt).toLocaleString()}</div>
      </div>
      <div style={{ marginLeft: 12 }}>
        <a href={item.ctaUrl}><button>{item.ctaLabel}</button></a>
      </div>
    </article>
  );
}
