"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ContentTemplate {
  id: string;
  name: string;
  description?: string;
  topic: string;
  mainKeyword: string;
  outline?: string;
  body?: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface TemplatePickerProps {
  templates: ContentTemplate[];
  onSelect: (template: ContentTemplate) => void;
}

export function TemplatePicker({ templates, onSelect }: TemplatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        className="text-sm text-blue-600 hover:text-blue-700"
      >
        {isOpen ? "▼" : "▶"} Szablony treści ({templates.length} dostępnych)
      </Button>

      {isOpen && (
        <Card className="p-4 space-y-2">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                onSelect(template);
                setIsOpen(false);
              }}
              className="w-full text-left p-3 rounded-md hover:bg-blue-50 border border-gray-200 transition"
            >
              <p className="font-medium text-gray-900">{template.name}</p>
              {template.description && (
                <p className="text-xs text-gray-600 mt-1">
                  {template.description}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                🔑 {template.mainKeyword}
              </p>
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}
