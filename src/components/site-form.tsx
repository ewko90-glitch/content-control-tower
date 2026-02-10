"use client";

import { useState } from "react";
import { editSite, addSite, type SiteState } from "@/app/actions/sites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";

interface SiteFormProps {
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
  onSuccess?: () => void;
}

export function SiteForm({ siteId, initialData, onSuccess }: SiteFormProps) {
  const [siteType, setSiteType] = useState<string>(initialData?.type || "OTHER");
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<SiteState>({ success: false });

  const handleSuccess = () => {
    if (state.success && onSuccess) {
      onSuccess();
    }
  };

  // Run callback when success changes
  if (state.success) {
    setTimeout(handleSuccess, 100);
  }

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const result = siteId && initialData
        ? await editSite(siteId, { success: false }, formData)
        : await addSite({ success: false }, formData);
      setState(result);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      {state.message && (
        <Alert variant={state.success ? "success" : "error"}>
          {state.message}
        </Alert>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Nazwa strony *</label>
        <Input
          name="name"
          placeholder="np. PanPrecel.pl, Sklep Shopify"
          defaultValue={initialData?.name || ""}
          required
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Typ *</label>
          <Select
            name="type"
            value={siteType}
            onChange={(e) => setSiteType(e.target.value)}
            disabled={isLoading}
          >
            <option value="WORDPRESS">WordPress</option>
            <option value="SHOPIFY">Shopify</option>
            <option value="OTHER">Inna</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status *</label>
          <Select
            name="status"
            defaultValue={initialData?.status || "ACTIVE"}
            disabled={isLoading}
          >
            <option value="ACTIVE">Aktywna</option>
            <option value="INACTIVE">Nieaktywna</option>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Adres strony *</label>
        <Input
          name="baseUrl"
          type="url"
          placeholder="https://example.com"
          defaultValue={initialData?.baseUrl || ""}
          required
          disabled={isLoading}
        />
        <p className="mt-1 text-xs text-gray-500">np. https://panprecel.pl lub https://sklep.example.com</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notatki (opcjonalnie)</label>
        <Input
          name="notes"
          placeholder="Dodatkowe informacje o tej stronie"
          defaultValue={initialData?.notes || ""}
          disabled={isLoading}
        />
      </div>

      {siteType === "WORDPRESS" && (
        <div className="space-y-4 rounded-lg bg-blue-50 p-4">
          <p className="text-sm font-medium text-gray-700">Dane WordPress (opcjonalnie)</p>

          <div>
            <label className="block text-xs font-medium text-gray-600">Adres panelu</label>
            <Input
              name="wpAdminUrl"
              type="url"
              placeholder="https://example.com/wp-admin"
              defaultValue={initialData?.wpAdminUrl || ""}
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">URL do panelu administracyjnego WordPress</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600">Login</label>
            <Input
              name="wpUsername"
              placeholder="Nazwa użytkownika"
              defaultValue={initialData?.wpUsername || ""}
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">Nazwa użytkownika do WordPress</p>
          </div>

          <p className="text-xs text-gray-500">Hasło aplikacji można zmienić w następnym kroku edycji.</p>
        </div>
      )}

      {siteType === "SHOPIFY" && (
        <div className="space-y-4 rounded-lg bg-green-50 p-4">
          <p className="text-sm font-medium text-gray-700">Dane Shopify (opcjonalnie)</p>

          <div>
            <label className="block text-xs font-medium text-gray-600">Domena sklepu</label>
            <Input
              name="shopifyShopDomain"
              placeholder="moj-sklep.myshopify.com"
              defaultValue={initialData?.shopifyShopDomain || ""}
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">Domena Twojego sklepu Shopify</p>
          </div>

          <p className="text-xs text-gray-500">Access token można zmienić w następnym kroku edycji.</p>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Przetwarzanie..." : (siteId && initialData ? "Zaktualizuj stronę" : "Dodaj stronę")}
        </Button>
      </div>
    </form>
  );
}
