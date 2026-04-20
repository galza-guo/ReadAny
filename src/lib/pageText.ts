import type { PageDoc } from "../types";

function joinParagraphs(page?: PageDoc): string {
  return (page?.paragraphs ?? [])
    .map((item) => item.source.trim())
    .filter(Boolean)
    .join("\n\n");
}

export function buildPageTranslationPayload(pages: PageDoc[], pageNumber: number) {
  return {
    page: pageNumber,
    displayText: joinParagraphs(pages.find((item) => item.page === pageNumber)),
    previousContext: joinParagraphs(pages.find((item) => item.page === pageNumber - 1)),
    nextContext: joinParagraphs(pages.find((item) => item.page === pageNumber + 1)),
  };
}

export function hasUsablePageText(text: string) {
  const cleaned = text.replace(/[\p{P}\p{S}\s]+/gu, "");
  return cleaned.length >= 8;
}

export function normalizeSelectionText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}
