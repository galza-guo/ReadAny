import { describe, expect, test } from "bun:test";
import type { PageDoc, Paragraph } from "../types";
import {
  buildPdfPageTranslatedText,
  getPdfAlignmentHint,
  getPdfAlignmentState,
  getTranslatablePdfParagraphs,
  isPdfPageFullyTranslated,
} from "./pdfSegments";

function paragraph(overrides: Partial<Paragraph> = {}): Paragraph {
  return {
    pid: "p-1",
    page: 1,
    source: "A readable paragraph of source text.",
    status: "idle",
    rects: [{ page: 1, x: 10, y: 20, w: 100, h: 24 }],
    ...overrides,
  };
}

function pageDoc(paragraphs: Paragraph[]): PageDoc {
  return {
    page: 1,
    paragraphs,
    isExtracted: true,
  };
}

describe("pdfSegments", () => {
  test("treats only usable paragraphs as translatable PDF segments", () => {
    const page = pageDoc([
      paragraph({ pid: "usable" }),
      paragraph({ pid: "noise", source: "---", rects: [] }),
    ]);

    expect(getTranslatablePdfParagraphs(page).map((item) => item.pid)).toEqual([
      "usable",
    ]);
  });

  test("marks a page as fully translated only when every usable segment is done", () => {
    expect(
      isPdfPageFullyTranslated(
        pageDoc([
          paragraph({
            pid: "done",
            status: "done",
            translation: "Translated paragraph.",
          }),
          paragraph({
            pid: "pending",
            status: "idle",
          }),
        ]),
      ),
    ).toBe(false);

    expect(
      isPdfPageFullyTranslated(
        pageDoc([
          paragraph({
            pid: "done-1",
            status: "done",
            translation: "Translated paragraph one.",
          }),
          paragraph({
            pid: "done-2",
            status: "done",
            translation: "Translated paragraph two.",
          }),
        ]),
      ),
    ).toBe(true);
  });

  test("builds a combined translated page view from translated segments", () => {
    const translated = buildPdfPageTranslatedText(
      pageDoc([
        paragraph({
          pid: "done-1",
          status: "done",
          translation: "Translated paragraph one.",
        }),
        paragraph({
          pid: "done-2",
          status: "done",
          translation: "Translated paragraph two.",
        }),
      ]),
    );

    expect(translated).toBe(
      "Translated paragraph one.\n\nTranslated paragraph two.",
    );
  });

  test("distinguishes mapped, coarse, and unavailable PDF alignment states", () => {
    expect(
      getPdfAlignmentState(pageDoc([paragraph({ pid: "mapped" })])),
    ).toBe("mapped");
    expect(
      getPdfAlignmentState(
        pageDoc([paragraph({ pid: "coarse", rects: [] })]),
      ),
    ).toBe("coarse");
    expect(getPdfAlignmentState(pageDoc([]))).toBe("unavailable");
  });

  test("explains alignment limits in plain language", () => {
    expect(getPdfAlignmentHint(pageDoc([paragraph()]))).toContain("highlight");
    expect(
      getPdfAlignmentHint(pageDoc([paragraph({ rects: [] })])),
    ).toContain("approximate");
    expect(getPdfAlignmentHint(pageDoc([]))).toContain("extracted text");
  });
});
