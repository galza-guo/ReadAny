import { describe, expect, test } from "bun:test";
import {
  buildPresetLabel,
  dedupePresetLabel,
  getNextThemeMode,
  getActivePreset,
  normalizeDefaultLanguage,
} from "./appSettings";

describe("app settings helpers", () => {
  test("builds a preset label from provider and model", () => {
    expect(buildPresetLabel("openrouter", "openai/gpt-4o-mini")).toBe(
      "OpenRouter · openai/gpt-4o-mini"
    );
    expect(buildPresetLabel("deepseek", "deepseek-chat")).toBe(
      "DeepSeek · deepseek-chat"
    );
  });

  test("adds a suffix when the generated preset label already exists", () => {
    expect(
      dedupePresetLabel("OpenRouter · openai/gpt-4o-mini", [
        "OpenRouter · openai/gpt-4o-mini",
        "OpenRouter · openai/gpt-4o-mini (2)",
      ])
    ).toBe("OpenRouter · openai/gpt-4o-mini (3)");
  });

  test("returns the active preset when the id exists", () => {
    const settings = {
      activePresetId: "preset-b",
      presets: [
        { id: "preset-a", label: "Preset A", model: "m1" },
        { id: "preset-b", label: "Preset B", model: "m2" },
      ],
    };

    expect(getActivePreset(settings)?.id).toBe("preset-b");
  });

  test("falls back to the first preset when the saved active preset is missing", () => {
    const settings = {
      activePresetId: "missing",
      presets: [
        { id: "preset-a", label: "Preset A", model: "m1" },
        { id: "preset-b", label: "Preset B", model: "m2" },
      ],
    };

    expect(getActivePreset(settings)?.id).toBe("preset-a");
  });

  test("normalizes the default language when the saved value is incomplete", () => {
    expect(normalizeDefaultLanguage(undefined)).toEqual({
      code: "zh-CN",
      label: "Chinese (Simplified)",
    });
    expect(normalizeDefaultLanguage({ code: "ja", label: "" })).toEqual({
      code: "ja",
      label: "Japanese",
    });
  });

  test("cycles themes in system, light, dark order", () => {
    expect(getNextThemeMode("system")).toBe("light");
    expect(getNextThemeMode("light")).toBe("dark");
    expect(getNextThemeMode("dark")).toBe("system");
  });
});
