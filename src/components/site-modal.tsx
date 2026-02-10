"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteForm } from "./site-form";

interface SiteModalProps {
  trigger?: React.ReactNode;
  siteId?: string;
  initialData?: {
    name: string;
    type: "WORDPRESS" | "SHOPIFY" | "OTHER";
    baseUrl: string;
    status: "ACTIVE" | "INACTIVE";
    notes: string | null;
    wpAdminUrl: string | null;
    wpUsername: string | null;
    shopifyShopDomain: string | null;
  };
  title?: string;
  onClose?: () => void;
}

export function SiteModal({
  trigger = <Button>+ Dodaj stronę</Button>,
  siteId,
  initialData,
  title,
  onClose
}: SiteModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleSuccess = () => {
    handleClose();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-block"
      >
        {trigger}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-lg">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {title || (siteId ? "Edytuj stronę" : "Dodaj nową stronę")}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="py-4">
          <SiteForm
            siteId={siteId}
            initialData={initialData}
            onSuccess={handleSuccess}
          />
        </div>
      </Card>
    </div>
  );
}
