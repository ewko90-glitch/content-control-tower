"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  listWebhooks, 
  toggleWebhook, 
  deleteWebhook 
} from "@/app/actions/webhooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadWebhooks();
  }, []);

  async function loadWebhooks() {
    try {
      setLoading(true);
      const result = await listWebhooks();
      if (result.success) {
        setWebhooks(result.webhooks);
      } else {
        setError(result.error || "Unknown error");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    try {
      const result = await toggleWebhook(id, !isActive);
      if (result.success) {
        setWebhooks(webhooks.map(w => 
          w.id === id ? { ...w, isActive: !isActive } : w
        ));
      } else {
        setError(result.error || "Unknown error");
      }
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this webhook?")) return;
    
    try {
      setDeleting(id);
      const result = await deleteWebhook(id);
      if (result.success) {
        setWebhooks(webhooks.filter(w => w.id !== id));
      } else {
        setError(result.error || "Unknown error");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setDeleting(null);
    }
  }

  if (loading) return <div className="p-6">Loading webhooks...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Webhooks</h1>
        <Link href="/settings/webhooks/new">
          <Button>Create Webhook</Button>
        </Link>
      </div>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-red-800">{error}</p>
        </Card>
      )}

      {webhooks.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">No webhooks created yet</p>
          <Link href="/settings/webhooks/new">
            <Button>Create Your First Webhook</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className="p-4">
              <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4">
                <div>
                  <h3 className="font-semibold">{webhook.name}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    <p>Type: <span className="font-mono text-xs px-2 py-1 bg-gray-100 rounded">{webhook.type}</span></p>
                    {webhook.email && <p>Email: {webhook.email}</p>}
                    <p className="mt-1">
                      Events: {webhook.events.join(", ")}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {webhook._count.logs} log entries
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(webhook.id, webhook.isActive)}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    webhook.isActive
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {webhook.isActive ? "Active" : "Inactive"}
                </button>

                <Link href={`/settings/webhooks/${webhook.id}`}>
                  <Button variant="secondary">Edit</Button>
                </Link>

                <button
                  onClick={() => handleDelete(webhook.id)}
                  disabled={deleting === webhook.id}
                  className="px-3 py-1 rounded text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting === webhook.id ? "..." : "Delete"}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
