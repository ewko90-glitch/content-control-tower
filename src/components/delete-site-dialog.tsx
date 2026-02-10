"use client";

import { useState, useTransition } from "react";
import { removeSite } from "@/app/actions/sites";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

interface DeleteSiteDialogProps {
  siteId: string;
  siteName: string;
  onClose?: () => void;
  onDeleted?: () => void;
}

export function DeleteSiteDialog({
  siteId,
  siteName,
  onClose,
  onDeleted
}: DeleteSiteDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await removeSite(siteId);
      if (!result.success) {
        setError(result.message || "Nie udało się usunąć strony.");
      } else {
        setIsOpen(false);
        onDeleted?.();
      }
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-sm">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Usuń stronę</h2>

          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          <p className="text-gray-600">
            Czy na pewno chcesz usunąć stronę <strong>&quot;{siteName}&quot;</strong>? Tej operacji nie można cofnąć.
          </p>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isPending ? "Usuwanie..." : "Usuń"}
            </Button>
            <Button
              onClick={handleClose}
              variant="secondary"
              disabled={isPending}
            >
              Anuluj
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
