import { describe, expect, test } from "bun:test";
import type { PageDoc, PageTranslationState } from "../types";
import * as pdfTranslationFeedback from "./pdfTranslationFeedback";

const { getPdfPageLoadingMessage } = pdfTranslationFeedback;

function makePage(overrides: Partial<PageDoc> = {}): PageDoc {
  return {
    page: 4,
    isExtracted: true,
    paragraphs: [
      {
        pid: "p4",
        page: 4,
        source: "This page has enough text to translate.",
        status: "idle",
        rects: [],
      },
    ],
    ...overrides,
  };
}

function makeState(
  overrides: Partial<PageTranslationState> = {},
): PageTranslationState {
  return {
    page: 4,
    displayText: "This page has enough text to translate.",
    previousContext: "",
    nextContext: "",
    status: "idle",
    ...overrides,
  };
}

describe("pdfTranslationFeedback", () => {
  test("shows extraction progress before the page is ready to translate", () => {
    expect(
      getPdfPageLoadingMessage({
        currentPage: 4,
        currentPageDoc: makePage({ isExtracted: false, paragraphs: [] }),
        currentPageTranslation: undefined,
        inFlightPage: null,
      }),
    ).toBe("Extracting text for this page...");
  });

  test("shows queue position for a waiting page", () => {
    expect(
      getPdfPageLoadingMessage({
        currentPage: 4,
        currentPageDoc: makePage(),
        currentPageTranslation: makeState({ status: "queued" }),
        inFlightPage: 2,
      }),
    ).toBe("Queued behind page 2.");
  });

  test("shows provider wait messaging once the request is live", () => {
    expect(
      getPdfPageLoadingMessage({
        currentPage: 4,
        currentPageDoc: makePage(),
        currentPageTranslation: makeState({
          status: "loading",
          activityMessage: "Translating this page...",
        }),
        inFlightPage: 4,
      }),
    ).toBe("Translating this page...");
  });

  test("does not show a fake preparing state before the page is actually queued", () => {
    expect(
      getPdfPageLoadingMessage({
        currentPage: 4,
        currentPageDoc: makePage(),
        currentPageTranslation: makeState({ status: "idle" }),
        inFlightPage: null,
      }),
    ).toBeNull();
  });

  test("shows when another PDF page is translating in the background", () => {
    const getPdfBackgroundTranslationMessage = (
      pdfTranslationFeedback as typeof pdfTranslationFeedback & {
        getPdfBackgroundTranslationMessage?: (args: {
          currentPage: number;
          inFlightPage: number | null;
          isTranslateAllRunning: boolean;
        }) => string | null;
      }
    ).getPdfBackgroundTranslationMessage;

    expect(typeof getPdfBackgroundTranslationMessage).toBe("function");
    if (!getPdfBackgroundTranslationMessage) return;

    expect(
      getPdfBackgroundTranslationMessage({
        currentPage: 4,
        inFlightPage: 5,
        isTranslateAllRunning: false,
      }),
    ).toBe("Translating page 5 in background");
  });
});
