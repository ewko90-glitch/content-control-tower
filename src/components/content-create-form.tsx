"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { useTransition } from "react";
import { createDraft } from "@/app/actions/content";


interface ContentTemplate {
  id: string;
  name: string;
  description?: string;
  topic: string;
  mainKeyword: string;
  type: string;
}

interface ContentCreateFormProps {
  templates?: ContentTemplate[];
}

export function ContentCreateForm({ templates = [] }: ContentCreateFormProps) {
  const router = useRouter();
  const [state] = useFormState(createDraft, { success: false });
  const [isPending, startTransition] = useTransition();
  
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  
  const [formData, setFormData] = useState({
    topic: "",
    type: "",
    mainKeyword: ""
  });

  const handleTemplateSelect = (template: ContentTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      topic: template.topic,
      type: template.type,
      mainKeyword: template.mainKeyword
    });
    setShowTemplates(false);
  };

  const handleClearTemplate = () => {
    setSelectedTemplate(null);
    setFormData({ topic: "", type: "", mainKeyword: "" });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formDataObj = new FormData(form);
    
    // Add templateId if selected
    if (selectedTemplate) {
      formDataObj.append("templateId", selectedTemplate.id);
    }

    startTransition(async () => {
      const result = await createDraft({ success: false }, formDataObj);
      if (result.success) {
        router.push("/content");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Template Picker */}
      {templates.length > 0 && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {selectedTemplate
                  ? `📋 Szablon: ${selectedTemplate.name}`
                  : "📋 Użyj szablonu (opcjonalnie)"}
              </p>
              {selectedTemplate && (
                <p className="text-xs text-gray-600 mt-1">
                  {selectedTemplate.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="px-3 py-1 text-sm rounded-md bg-white border border-purple-300 hover:bg-purple-50 transition"
              >
                {showTemplates ? "▼" : "▶"} Szablony
              </button>
              {selectedTemplate && (
                <button
                  type="button"
                  onClick={handleClearTemplate}
                  className="px-3 py-1 text-sm rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {showTemplates && (
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className={`w-full text-left p-2 rounded-md transition ${
                    selectedTemplate?.id === template.id
                      ? "bg-purple-200 border border-purple-400"
                      : "bg-white border border-gray-200 hover:bg-purple-50"
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">
                    {template.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    🔑 {template.mainKeyword}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <label htmlFor="topic" className="block text-sm font-medium text-gray-900">
          Temat treści <span className="text-red-600">*</span>
        </label>
        <input
          id="topic"
          name="topic"
          type="text"
          placeholder="np. Jak zoptymalizować SEO bloga"
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          required
          className="mt-2 w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Główny temat, który będzie podstawą treści.
        </p>
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-900">
          Typ treści <span className="text-red-600">*</span>
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          required
          className="mt-2 w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Wybierz typ...</option>
          <option value="WP_POST">Post WordPress</option>
          <option value="LINKEDIN_POST">Post LinkedIn</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Gdzie będzie publikowana ta treść?
        </p>
      </div>

      <div>
        <label htmlFor="mainKeyword" className="block text-sm font-medium text-gray-900">
          Główne słowo kluczowe <span className="text-red-600">*</span>
        </label>
        <input
          id="mainKeyword"
          name="mainKeyword"
          type="text"
          placeholder="np. SEO blog"
          value={formData.mainKeyword}
          onChange={(e) => setFormData({ ...formData, mainKeyword: e.target.value })}
          required
          className="mt-2 w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Słowo kluczowe dla SEO i organizacji treści.
        </p>
      </div>

      {state && !state.success && state.message && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {isPending ? "Tworzę..." : "Utwórz treść"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-md bg-gray-200 text-gray-900 text-sm font-medium hover:bg-gray-300 transition"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}
