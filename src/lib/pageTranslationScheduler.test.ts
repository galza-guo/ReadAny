import { describe, expect, test } from "bun:test";
import type { PageDoc, PageTranslationState } from "../types";
import {
  dequeueNextPage,
  enqueueBackgroundPages,
  enqueueForegroundPage,
  getFullBookActionLabel,
  getPageTranslationProgress,
  isRequestVersionCurrent,
  bumpRequestVersion,
} from "./pageTranslationScheduler";

describe("pageTranslationScheduler queues", () => {
  test("promotes the current page ahead of background work without duplicating it", () => {
    const backgroundQueue = enqueueBackgroundPages([], [2, 3, 4]);
    const foregroundQueue = enqueueForegroundPage([], 3);
    const next = dequeueNextPage({
      foregroundQueue,
      backgroundQueue,
      inFlightPages: [],
    });

    expect(next).toEqual({
      page: 3,
      foregroundQueue: [],
      backgroundQueue: [2, 4],
    });
  });

  test("skips pages that are already in flight until they are available again", () => {
    const next = dequeueNextPage({
      foregroundQueue: [5],
      backgroundQueue: [6, 7],
      inFlightPages: [5, 6],
    });

    expect(next).toEqual({
      page: 7,
      foregroundQueue: [5],
      backgroundQueue: [6],
    });
  });
});

describe("pageTranslationScheduler progress", () => {
  test("counts cached and freshly translated translatable pages", () => {
    const pages: PageDoc[] = [
      {
        page: 1,
        paragraphs: [{ pid: "a", page: 1, source: "A readable first page.", status: "idle", rects: [] }],
      },
      {
        page: 2,
        paragraphs: [{ pid: "b", page: 2, source: "Symbols --- ...", status: "idle", rects: [] }],
      },
      {
        page: 3,
        paragraphs: [{ pid: "c", page: 3, source: "Another readable page.", status: "idle", rects: [] }],
      },
    ];
    const pageTranslations: Record<number, PageTranslationState> = {
      3: {
        page: 3,
        displayText: "Another readable page.",
        previousContext: "",
        nextContext: "",
        status: "done",
        translatedText: "Another readable page translated.",
      },
    };

    expect(
      getPageTranslationProgress({
        pages,
        pageTranslations,
        cachedPages: [1],
      })
    ).toEqual({
      translatedCount: 2,
      totalCount: 2,
      isFullyTranslated: true,
    });
  });

  test("uses Replace All only when every translatable page is already translated", () => {
    expect(getFullBookActionLabel({ translatedCount: 1, totalCount: 3, isFullyTranslated: false })).toBe(
      "Translate All"
    );
    expect(getFullBookActionLabel({ translatedCount: 3, totalCount: 3, isFullyTranslated: true })).toBe(
      "Replace All"
    );
  });
});

describe("pageTranslationScheduler request versions", () => {
  test("invalidates stale page results after a newer redo request", () => {
    const first = bumpRequestVersion({}, 12);
    const second = bumpRequestVersion(first.versions, 12);

    expect(isRequestVersionCurrent(second.versions, 12, first.version)).toBe(false);
    expect(isRequestVersionCurrent(second.versions, 12, second.version)).toBe(true);
  });
});
