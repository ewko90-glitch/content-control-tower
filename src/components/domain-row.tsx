"use client";

import { useState } from "react";
import { removeDomain } from "@/app/actions/domains";
import type { Domain } from "@prisma/client";
import { Button } from "./ui/button";
import { DeleteDomainDialog } from "./delete-domain-dialog";

type Props = {
  domain: Domain;
  onEdit: (domain: Domain) => void;
};

export function DomainRow({ domain, onEdit }: Props) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <>
      <tr className="border-t border-gray-200 hover:bg-gray-50">
        <td className="px-6 py-4">
          <div>
            <p className="font-medium text-gray-900">{domain.name}</p>
            <p className="text-xs text-gray-500">{domain.slug}</p>
          </div>
        </td>
        <td className="px-6 py-4">
          <p className="text-sm text-gray-600">{domain.description || "-"}</p>
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => onEdit(domain)}
              className="text-xs"
            >
              Edytuj
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowDelete(true)}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Usuń
            </Button>
          </div>
        </td>
      </tr>

      <DeleteDomainDialog
        domainName={domain.name}
        isOpen={showDelete}
        onCancel={() => setShowDelete(false)}
        onConfirm={async () => {
          const result = await removeDomain(domain.id);
          if (!result.success) {
            console.error(result.message);
          }
          return result;
        }}
      />
    </>
  );
}
