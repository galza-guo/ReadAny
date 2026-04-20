import { describe, expect, test } from "bun:test";
import {
  COMMON_LANGUAGE_PRESETS,
  LANGUAGE_PRESETS,
  buildCustomLanguage,
  buildLanguagePickerSections,
  getCustomLanguageOption,
} from "./languageOptions";

describe("language options", () => {
  test("includes a broad built-in language list with common variants", () => {
    expect(LANGUAGE_PRESETS.length).toBeGreaterThan(60);
    expect(LANGUAGE_PRESETS).toContainEqual({
      label: "Portuguese",
      code: "pt",
    });
    expect(LANGUAGE_PRESETS).toContainEqual({
      label: "Portuguese (Brazil)",
      code: "pt-BR",
    });
    expect(LANGUAGE_PRESETS).toContainEqual({
      label: "Serbian (Latin)",
      code: "sr-Latn",
    });
  });

  test("keeps a short quick-pick subset at the top of the picker", () => {
    expect(COMMON_LANGUAGE_PRESETS).toEqual([
      { label: "Chinese (Simplified)", code: "zh-CN" },
      { label: "Chinese (Traditional)", code: "zh-TW" },
      { label: "English", code: "en" },
      { label: "Japanese", code: "ja" },
      { label: "Korean", code: "ko" },
      { label: "Spanish", code: "es" },
      { label: "French", code: "fr" },
    ]);
  });

  test("creates a stable custom language from free text", () => {
    expect(buildCustomLanguage("Hong Kong Traditional Chinese")).toEqual({
      label: "Hong Kong Traditional Chinese",
      code: "custom:hong-kong-traditional-chinese",
    });
  });

  test("offers a custom language option only when no exact match exists", () => {
    expect(getCustomLanguageOption("Portuguese")).toBeUndefined();
    expect(getCustomLanguageOption("Hong Kong Traditional Chinese")).toEqual({
      label: "Hong Kong Traditional Chinese",
      code: "custom:hong-kong-traditional-chinese",
    });
  });

  test("keeps quick picks unlabelled and then repeats the full list under All languages", () => {
    const sections = buildLanguagePickerSections("");

    expect(sections[0]?.title).toBeUndefined();
    expect(sections[0]?.items).toEqual(COMMON_LANGUAGE_PRESETS);
    expect(sections[1]?.title).toBe("All languages");
    expect(sections[1]?.items[0]).toEqual({
      label: "Afrikaans",
      code: "af",
    });
    expect(sections[1]?.items).toContainEqual({
      label: "French",
      code: "fr",
    });
    expect(sections[1]?.items).toContainEqual({
      label: "Portuguese",
      code: "pt",
    });
    expect(
      sections.some((section) => section.title === "Common languages")
    ).toBe(false);
  });

  test("shows only the exhaustive section when a search skips the quick picks", () => {
    const sections = buildLanguagePickerSections("port");

    expect(sections).toHaveLength(1);
    expect(sections[0]?.title).toBe("All languages");
    expect(sections[0]?.items).toContainEqual({
      label: "Portuguese",
      code: "pt",
    });
  });
});
