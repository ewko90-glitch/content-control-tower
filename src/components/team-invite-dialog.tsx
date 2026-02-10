"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type TeamInviteDialogProps = {
  disabled?: boolean;
  seatCount: number;
  seatLimit: number;
  className?: string;
  label?: string;
};

export function TeamInviteDialog({
  disabled = false,
  seatCount,
  seatLimit,
  className,
  label = "Zaproś osobę"
}: TeamInviteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleClose = () => setIsOpen(false);

  return (
    <>
      <Button onClick={handleOpen} disabled={disabled} className={className}>
        {label}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Zaproś osobę</h2>
                <p className="text-sm text-gray-600">
                  Wkrótce: wysyłanie zaproszeń e-mail z przypisaną rolą.
                </p>
              </div>

              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                <p>Użyte miejsca: {seatCount} / {seatLimit}</p>
                <p className="mt-2">Formularz zaproszeń będzie tu dostępny w kolejnych krokach.</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={handleClose}>
                  Zamknij
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
