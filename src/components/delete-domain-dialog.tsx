"use client";

import { useTransition } from "react";
import type { DomainState } from "@/app/actions/domains";
import { Button } from "./ui/button";

type Props = {
  domainName: string;
  onConfirm: () => Promise<DomainState>;
  onCancel: () => void;
  isOpen: boolean;
};

export function DeleteDomainDialog({ domainName, onConfirm, onCancel, isOpen }: Props) {
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleConfirm = () => {
    startTransition(async () => {
      await onConfirm();
      onCancel();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">Usunąć domenę?</h2>
        <p className="mt-2 text-sm text-gray-600">
          Czy na pewno chcesz usunąć domenę <strong>{domainName}</strong>? Tej operacji nie można cofnąć.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={isPending}>
            Anuluj
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-500"
          >
            {isPending ? "Usuwanie..." : "Usuń"}
          </Button>
        </div>
      </div>
    </div>
  );
}
