import { describe, expect, test } from "bun:test";
import { getReaderStatusLabel } from "./readerStatus";

describe("getReaderStatusLabel", () => {
  test("keeps ready short", () => {
    expect(getReaderStatusLabel("ready")).toBe("Ready");
  });

  test("keeps document loading concise", () => {
    expect(getReaderStatusLabel("loading-document")).toBe("Loading document");
  });

  test("keeps text extraction concise", () => {
    expect(getReaderStatusLabel("extracting-text")).toBe("Extracting text");
  });

  test("includes the page number when translating", () => {
    expect(getReaderStatusLabel("translating-page", { page: 6 })).toBe("Translating page 6");
  });

  test("includes the page number when redoing", () => {
    expect(getReaderStatusLabel("redoing-page", { page: 9 })).toBe("Redoing page 9");
  });

  test("supports generic section translation labels", () => {
    expect(getReaderStatusLabel("translating-section")).toBe("Translating section");
    expect(getReaderStatusLabel("redoing-section")).toBe("Redoing section");
  });
});
