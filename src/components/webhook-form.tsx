"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWebhook, updateWebhook } from "@/app/actions/webhooks";
import { Button } from "@/components/ui/button";

const EVENTS = [
  "STATUS_CHANGED",
  "APPROVAL_REQUESTED",
  "APPROVED",
  "REJECTED",
  "SCHEDULED",
  "PUBLISHED"
];

export function WebhookForm({ webhook }: { webhook?: Record<string, unknown> }) {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  interface WebhookFormData {
    name: string;
    type: string;
    url: string;
    email: string;
    events: string[];
  }

  const [formData, setFormData] = useState<WebhookFormData>({
    name: (webhook?.name as string) || "",
    type: (webhook?.type as string) || "slack",
    url: (webhook?.url as string) || "",
    email: (webhook?.email as string) || "",
    events: (webhook?.events as string[]) || ["PUBLISHED"]
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("type", formData.type);
      if (formData.url) fd.append("url", formData.url);
      if (formData.email) fd.append("email", formData.email);
      formData.events.forEach((ev) => fd.append("events", ev));

      const result = webhook
        ? await updateWebhook((webhook.id as string) || "", fd)
        : await createWebhook(fd);

      if (result.success) {
        router.push("/settings/webhooks");
        router.refresh();
      } else {
        setError(result.error || "Unknown error");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  function toggleEvent(event: string) {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event) ? prev.events.filter((e) => e !== event) : [...prev.events, event]
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Webhook Name *</label>
        <input
          type="text"
          value={formData.name}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange={e => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Slack Notifications"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Type *</label>
        <select
          value={formData.type}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange={e => setFormData((prev: any) => ({ ...prev, type: e.target.value as any }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="slack">Slack</option>
          <option value="email">Email</option>
        </select>
      </div>

      {formData.type === "slack" && (
        <div>
          <label className="block text-sm font-medium mb-2">Slack Webhook URL *</label>
          <input
            type="url"
            value={formData.url}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange={e => setFormData((prev: any) => ({ ...prev, url: e.target.value }))}
            placeholder="https://hooks.slack.com/services/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs"
            required={formData.type === "slack"}
          />
          <p className="text-xs text-gray-600 mt-1">
            Get this from Slack &gt; Integrations &gt; Incoming Webhooks
          </p>
        </div>
      )}

      {formData.type === "email" && (
        <div>
          <label className="block text-sm font-medium mb-2">Email Address *</label>
          <input
            type="email"
            value={formData.email}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange={e => setFormData((prev: any) => ({ ...prev, email: e.target.value }))}
            placeholder="notifications@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required={formData.type === "email"}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-3">Events to Subscribe *</label>
        <div className="space-y-2">
          {EVENTS.map(event => (
            <label key={event} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.events.includes(event)}
                onChange={() => toggleEvent(event)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {event}
                </span>
                <span className="text-gray-600 ml-2">
                  {event === "STATUS_CHANGED" && "Content status changed"}
                  {event === "APPROVAL_REQUESTED" && "Approval requested"}
                  {event === "APPROVED" && "Content approved"}
                  {event === "REJECTED" && "Content rejected"}
                  {event === "SCHEDULED" && "Content scheduled"}
                  {event === "PUBLISHED" && "Content published"}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : webhook ? "Update Webhook" : "Create Webhook"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
