import { requireWorkspace } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { WebhookForm } from "@/components/webhook-form";
import { notFound } from "next/navigation";

interface Params {
  id: string;
}

export default async function EditWebhookPage({ params }: { params: Params }) {
  const { workspaceId } = await requireWorkspace();

  const webhook = await prisma.webhook.findFirst({
    where: {
      id: params.id,
      workspaceId
    }
  });

  if (!webhook) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Webhook</h1>
        <p className="text-gray-600 mt-2">
          Update webhook configuration and subscribed events
        </p>
      </div>
      <WebhookForm webhook={webhook} />
    </div>
  );
}
