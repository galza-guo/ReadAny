import type { PageDoc, PageTranslationState } from "../types";

type GetPdfPageLoadingMessageArgs = {
  currentPage: number;
  currentPageDoc?: PageDoc;
  currentPageTranslation?: PageTranslationState;
  inFlightPage: number | null;
};

export function getPdfPageLoadingMessage({
  currentPage,
  currentPageDoc,
  currentPageTranslation,
  inFlightPage,
}: GetPdfPageLoadingMessageArgs): string | null {
  if (currentPageTranslation?.status === "loading") {
    return currentPageTranslation.activityMessage ?? "Translating this page...";
  }

  if (currentPageTranslation?.status === "queued") {
    if (inFlightPage !== null && inFlightPage !== currentPage) {
      return `Queued behind page ${inFlightPage}.`;
    }

    return (
      currentPageTranslation.activityMessage ?? "Queued for translation..."
    );
  }

  if (!currentPageDoc?.isExtracted) {
    return "Extracting text for this page...";
  }

  return null;
}
