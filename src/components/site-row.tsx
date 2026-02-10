"use client";

import { useState } from "react";
import { SiteModal } from "./site-modal";
import { DeleteSiteDialog } from "./delete-site-dialog";

interface SiteRowProps {
  id: string;
  name: string;
  type: "WORDPRESS" | "SHOPIFY" | "OTHER";
  baseUrl: string;
  status: "ACTIVE" | "INACTIVE";
  notes: string | null;
  wpAdminUrl: string | null;
  wpUsername: string | null;
  shopifyShopDomain: string | null;
  updatedAt: Date;
  onSiteDeleted?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  WORDPRESS: "WordPress",
  SHOPIFY: "Shopify",
  OTHER: "Inna"
};

export function SiteRow({
  id,
  name,
  type,
  baseUrl,
  status,
  notes,
  wpAdminUrl,
  wpUsername,
  shopifyShopDomain,
  updatedAt,
  onSiteDeleted
}: SiteRowProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formattedDate = new Date(updatedAt).toLocaleString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <>
      <tr className="border-b border-gray-200 hover:bg-gray-50">
        <td className="px-4 py-3">
          <div>
            <p className="font-medium text-gray-900">{name}</p>
            {notes && <p className="text-sm text-gray-500">{notes}</p>}
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
            {TYPE_LABELS[type]}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          <a href={baseUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {baseUrl}
          </a>
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
              status === "ACTIVE"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {status === "ACTIVE" ? "Aktywna" : "Nieaktywna"}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">{formattedDate}</td>
        <td className="px-4 py-3 text-right">
          <button
            onClick={() => setShowEditModal(true)}
            className="mr-2 text-blue-600 hover:underline"
          >
            Edytuj
          </button>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 hover:underline"
          >
            Usuń
          </button>
        </td>
      </tr>

      {showEditModal && (
        <SiteModal
          siteId={id}
          initialData={{
            name,
            type,
            baseUrl,
            status,
            notes,
            wpAdminUrl,
            wpUsername,
            shopifyShopDomain
          }}
          title="Edytuj stronę"
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showDeleteDialog && (
        <DeleteSiteDialog
          siteId={id}
          siteName={name}
          onClose={() => setShowDeleteDialog(false)}
          onDeleted={() => {
            setShowDeleteDialog(false);
            onSiteDeleted?.();
          }}
        />
      )}
    </>
  );
}
