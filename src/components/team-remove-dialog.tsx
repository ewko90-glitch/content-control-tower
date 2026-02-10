"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type TeamRemoveDialogProps = {
  memberName: string;
  memberEmail: string;
  disabled?: boolean;
  disabledReason?: string;
};

export function TeamRemoveDialog({
  memberName,
  memberEmail,
  disabled = false,
  disabledReason
}: TeamRemoveDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [done, setDone] = useState(false);

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true);
      setDone(false);
      setConfirmation("");
    }
  };

  const handleClose = () => setIsOpen(false);

  const canConfirm = useMemo(() => confirmation.trim() === memberEmail, [confirmation, memberEmail]);

  const handleConfirm = () => {
    setDone(true);
  };

  return (
    <div className="text-right">
      <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={handleOpen} disabled={disabled}>
        Usuń z projektu
      </Button>
      {disabled && disabledReason && (
        <p className="mt-1 text-xs text-gray-500">{disabledReason}</p>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Usuń z projektu?</h2>
                <p className="text-sm text-gray-600">
                  To działanie jest trwałe. Aby potwierdzić, wpisz e-mail użytkownika.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                <p className="font-medium">{memberName}</p>
                <p className="text-xs text-gray-500">{memberEmail}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600">
                  Potwierdzenie (wpisz {memberEmail})
                </label>
                <input
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder={memberEmail}
                />
              </div>

              {done ? (
                <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
                  Wkrótce: usuwanie członków zostanie podpięte do logiki serwera.
                </div>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={handleClose}>
                  Anuluj
                </Button>
                <Button onClick={handleConfirm} disabled={!canConfirm}>
                  Potwierdzam usunięcie
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
