import { describe, expect, test } from "bun:test";
import {
  decideEdgePageTurn,
  getInitialPdfNavTab,
  normalizePdfOutline,
  resolvePdfDestinationPage,
} from "./pdfNavigation";

describe("getInitialPdfNavTab", () => {
  test("defaults to thumbnails when nothing has been stored", () => {
    expect(getInitialPdfNavTab(null)).toBe("thumbnails");
  });

  test("restores a stored valid tab", () => {
    expect(getInitialPdfNavTab("contents")).toBe("contents");
  });
});

describe("decideEdgePageTurn", () => {
  test("moves forward only when the user scrolls down at the bottom edge", () => {
    expect(
      decideEdgePageTurn({
        deltaY: 24,
        scrollTop: 600,
        clientHeight: 300,
        scrollHeight: 900,
      })
    ).toBe("next");
  });

  test("moves backward only when the user scrolls up at the top edge", () => {
    expect(
      decideEdgePageTurn({
        deltaY: -24,
        scrollTop: 0,
        clientHeight: 300,
        scrollHeight: 900,
      })
    ).toBe("prev");
  });

  test("does not turn the page away from the edges", () => {
    expect(
      decideEdgePageTurn({
        deltaY: 24,
        scrollTop: 320,
        clientHeight: 300,
        scrollHeight: 900,
      })
    ).toBeNull();
  });
});

describe("normalizePdfOutline", () => {
  test("maps resolved outline items into page links", async () => {
    const result = await normalizePdfOutline(
      [{ title: "Intro", dest: [{ num: 10, gen: 0 }], items: [] }] as any,
      {
        getPageNumberFromDest: async () => 3,
      }
    );

    expect(result).toEqual([{ id: "0", title: "Intro", page: 3, depth: 0 }]);
  });

  test("flattens nested outline items while preserving depth", async () => {
    const result = await normalizePdfOutline(
      [
        {
          title: "Chapter 1",
          dest: [{ num: 10, gen: 0 }],
          items: [{ title: "Section 1.1", dest: [{ num: 11, gen: 0 }], items: [] }],
        },
      ] as any,
      {
        getPageNumberFromDest: async (dest) => (dest[0].num === 10 ? 3 : 4),
      }
    );

    expect(result).toEqual([
      { id: "0", title: "Chapter 1", page: 3, depth: 0 },
      { id: "0-0", title: "Section 1.1", page: 4, depth: 1 },
    ]);
  });

  test("resolves string destinations before mapping them to pages", async () => {
    const result = await normalizePdfOutline([{ title: "Appendix", dest: "appendix" }] as any, {
      getPageNumberFromDest: async (dest) => (dest === "appendix" ? 9 : null),
    });

    expect(result).toEqual([{ id: "0", title: "Appendix", page: 9, depth: 0 }]);
  });

  test("skips items whose destinations cannot be resolved", async () => {
    const result = await normalizePdfOutline(
      [
        { title: "Broken", dest: "missing" },
        { title: "Working", dest: [{ num: 12, gen: 0 }] },
      ] as any,
      {
        getPageNumberFromDest: async (dest) => (typeof dest === "string" ? null : 5),
      }
    );

    expect(result).toEqual([{ id: "1", title: "Working", page: 5, depth: 0 }]);
  });
});

describe("resolvePdfDestinationPage", () => {
  test("resolves a named destination through the document", async () => {
    const page = await resolvePdfDestinationPage("chapter-1", {
      getDestination: async (name) => (name === "chapter-1" ? [{ num: 15, gen: 0 }] : null),
      getPageIndex: async (ref) => (ref.num === 15 ? 4 : 0),
    });

    expect(page).toBe(5);
  });

  test("returns null when a named destination is missing", async () => {
    const page = await resolvePdfDestinationPage("missing", {
      getDestination: async () => null,
      getPageIndex: async () => 0,
    });

    expect(page).toBeNull();
  });

  test("resolves an explicit destination array directly", async () => {
    const page = await resolvePdfDestinationPage([{ num: 20, gen: 0 }], {
      getDestination: async () => null,
      getPageIndex: async (ref) => (ref.num === 20 ? 8 : 0),
    });

    expect(page).toBe(9);
  });
});
