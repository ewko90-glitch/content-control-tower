import { WebhookForm } from "@/components/webhook-form";

export default function NewWebhookPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Webhook</h1>
        <p className="text-gray-600 mt-2">
          Configure a new webhook to receive notifications for content events
        </p>
      </div>
      <WebhookForm />
    </div>
  );
}
