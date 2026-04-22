import type { PageDoc, Paragraph } from "../types";
import { hasUsablePageText } from "./pageText";

export type PdfAlignmentState = "mapped" | "coarse" | "unavailable";

export function getTranslatablePdfParagraphs(page?: PageDoc): Paragraph[] {
  return (page?.paragraphs ?? []).filter((paragraph) =>
    hasUsablePageText(paragraph.source),
  );
}

export function buildPdfPageTranslatedText(page?: PageDoc) {
  return getTranslatablePdfParagraphs(page)
    .map((paragraph) => paragraph.translation?.trim())
    .filter((translation): translation is string => Boolean(translation))
    .join("\n\n");
}

export function isPdfPageFullyTranslated(page?: PageDoc) {
  const paragraphs = getTranslatablePdfParagraphs(page);
  return (
    paragraphs.length > 0 &&
    paragraphs.every(
      (paragraph) =>
        paragraph.status === "done" && Boolean(paragraph.translation?.trim()),
    )
  );
}

export function getPdfAlignmentState(page?: PageDoc): PdfAlignmentState {
  const paragraphs = getTranslatablePdfParagraphs(page);
  if (paragraphs.length === 0) {
    return "unavailable";
  }

  if (paragraphs.every((paragraph) => paragraph.rects.length > 0)) {
    return "mapped";
  }

  return "coarse";
}

export function getPdfAlignmentHint(page?: PageDoc) {
  const alignment = getPdfAlignmentState(page);

  switch (alignment) {
    case "mapped":
      return "Hover a translation to highlight its source in the PDF.";
    case "coarse":
      return "This page can be translated, but PDF highlighting may only be approximate.";
    default:
      return "This page does not contain enough extracted text to map translations back to the PDF.";
  }
}

