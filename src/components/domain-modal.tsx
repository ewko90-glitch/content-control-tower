"use client";

import { useCallback } from "react";
import type { Domain } from "@prisma/client";
import { DomainForm } from "./domain-form";
import { addDomain, editDomain } from "@/app/actions/domains";

type Props = {
  domain?: Domain | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function DomainModal({ domain, isOpen, onClose, onSuccess }: Props) {
  const isEdit = !!domain;

  const handleSuccess = useCallback(() => {
    onClose();
    onSuccess?.();
  }, [onClose, onSuccess]);

  if (!isOpen) return null;

  // Bind editDomain with domainId for edit mode
  const action = isEdit
    ? (state: any, formData: FormData) => editDomain(domain!.id, state, formData)
    : addDomain;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edytuj domenę" : "Dodaj nową domenę"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            type="button"
            aria-label="Zamknij"
          >
            ✕
          </button>
        </div>

        <DomainForm
          action={action}
          initialName={isEdit ? domain?.name || "" : ""}
          initialSlug={isEdit ? domain?.slug || "" : ""}
          initialDescription={isEdit ? domain?.description || "" : ""}
          submitLabel={isEdit ? "Zapisz" : "Utwórz"}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}
