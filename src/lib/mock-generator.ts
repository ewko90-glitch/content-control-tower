import type { InternalLink, ExternalLink } from "@prisma/client";

export function generateMockContent(params: {
  topic: string;
  mainKeyword: string;
  internalLinks: InternalLink[];
  externalLinks: ExternalLink[];
}) {
  const { topic, mainKeyword } = params;
  const title = `${topic}: Kompletny przewodnik`;
  const outline = `## Wprowadzenie\n### Dlaczego ${mainKeyword} jest ważne\n## Kluczowe kroki\n### Praktyczne wskazówki\n## Podsumowanie`;
  const body = `Ten artykuł omawia temat: ${topic}.\n\n${mainKeyword} pojawia się w kontekście strategii treści, planowania i publikacji.\n\nW kolejnych sekcjach znajdziesz uporządkowane kroki oraz checklistę.`;
  const metaTitle = `${topic} | ${mainKeyword}`;
  const metaDescription = `Praktyczny przewodnik o ${topic} z naciskiem na ${mainKeyword}.`;
  const suggestedInternalLinks = params.internalLinks.slice(0, 3).map((link) => link.url);
  const suggestedExternalLinks = params.externalLinks.slice(0, 3).map((link) => link.url);

  return {
    title,
    outline,
    body,
    metaTitle,
    metaDescription,
    suggestedInternalLinks,
    suggestedExternalLinks
  };
}
