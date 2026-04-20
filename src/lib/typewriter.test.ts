import { describe, expect, test } from "bun:test";
import { getNextRevealText } from "./typewriter";

describe("typewriter", () => {
  test("reveals text in bounded increments", () => {
    expect(getNextRevealText("", "abcdef", 2)).toBe("ab");
    expect(getNextRevealText("ab", "abcdef", 2)).toBe("abcd");
  });

  test("never reveals beyond the full text", () => {
    expect(getNextRevealText("abcd", "abc", 5)).toBe("abc");
  });

  test("returns the full string unchanged for cached pages", () => {
    expect(getNextRevealText("cached", "cached", 4)).toBe("cached");
  });
});
