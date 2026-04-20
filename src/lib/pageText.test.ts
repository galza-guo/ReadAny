import { describe, expect, test } from "bun:test";
import type { PageDoc } from "../types";
import {
  buildPageTranslationPayload,
  hasUsablePageText,
  normalizeSelectionText,
} from "./pageText";

describe("pageText", () => {
  test("builds display text and neighbor context from page paragraphs", () => {
    const pages: PageDoc[] = [
      { page: 1, paragraphs: [{ pid: "a", page: 1, source: "Prev tail", status: "idle", rects: [] }] },
      { page: 2, paragraphs: [{ pid: "b", page: 2, source: "Main body", status: "idle", rects: [] }] },
      { page: 3, paragraphs: [{ pid: "c", page: 3, source: "Next lead", status: "idle", rects: [] }] },
    ];

    expect(buildPageTranslationPayload(pages, 2)).toEqual({
      page: 2,
      displayText: "Main body",
      previousContext: "Prev tail",
      nextContext: "Next lead",
    });
  });

  test("treats punctuation-only OCR noise as unusable page text", () => {
    expect(hasUsablePageText("...   ---")).toBe(false);
  });
});

describe("selection text", () => {
  test("collapses whitespace before translation", () => {
    expect(normalizeSelectionText("foo \n  bar")).toBe("foo bar");
  });
});
