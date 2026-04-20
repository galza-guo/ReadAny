import { describe, expect, test } from "bun:test";
import { clampPage, getPagesToTranslate } from "./pageQueue";

describe("pageQueue", () => {
  test("returns current page and next page within bounds", () => {
    expect(getPagesToTranslate(5, 8)).toEqual([5, 6]);
  });

  test("does not overflow past the last page", () => {
    expect(getPagesToTranslate(8, 8)).toEqual([8]);
  });

  test("prefetches current page and next page only", () => {
    expect(getPagesToTranslate(2, 4)).toEqual([2, 3]);
  });
});

describe("page navigation", () => {
  test("clamps requested page inside the document bounds", () => {
    expect(clampPage(0, 10)).toBe(1);
    expect(clampPage(11, 10)).toBe(10);
  });
});
