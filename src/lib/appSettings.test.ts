import { describe, expect, test } from "bun:test";
import {
  buildPresetLabel,
  createPresetDraft,
  createDefaultSettings,
  dedupePresetLabel,
  getPresetApiKeyFieldState,
  getPresetValidationState,
  getNextThemeMode,
  getActivePreset,
  normalizeDefaultLanguage,
  normalizePresetDraft,
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

  test("starts with no presets for a brand-new user", () => {
    expect(createDefaultSettings()).toEqual({
      activePresetId: "",
      defaultLanguage: {
        code: "zh-CN",
        label: "Chinese (Simplified)",
      },
      theme: "system",
      presets: [],
    });
  });

  test("starts a new preset as openai-compatible with empty required fields", () => {
    const preset = createPresetDraft("openai-compatible", []);

    expect(preset.providerKind).toBe("openai-compatible");
    expect(preset.model).toBe("");
    expect(preset.baseUrl).toBeUndefined();
    expect(preset.label).toBe("Custom");
  });

  test("keeps model empty while editing instead of backfilling a default model", () => {
    const preset = normalizePresetDraft(
      {
        id: "preset-1",
        label: "",
        providerKind: "openrouter",
        model: "   ",
      },
      []
    );

    expect(preset.model).toBe("");
    expect(preset.label).toBe("OpenRouter");
  });

  test("treats provider, model, and api key as required and base url as required for openai-compatible", () => {
    expect(
      getPresetValidationState(
        {
          id: "preset-1",
          label: "Custom",
          providerKind: "openai-compatible",
          model: "",
        },
        ""
      )
    ).toEqual({
      apiKey: false,
      baseUrl: false,
      isValid: false,
      model: false,
      provider: true,
    });

    expect(
      getPresetValidationState(
        {
          id: "preset-2",
          label: "OpenRouter",
          providerKind: "openrouter",
          model: "openai/gpt-4o-mini",
          apiKeyConfigured: true,
        },
        ""
      )
    ).toEqual({
      apiKey: true,
      baseUrl: true,
      isValid: true,
      model: true,
      provider: true,
    });
  });

  test("shows a masked saved-key state until the field is actively edited", () => {
    expect(
      getPresetApiKeyFieldState({
        apiKeyConfigured: true,
        apiKeyInput: "",
        isEditing: false,
      })
    ).toEqual({
      displayValue: "",
      placeholder: "**************",
      showsSavedMask: true,
    });

    expect(
      getPresetApiKeyFieldState({
        apiKeyConfigured: true,
        apiKeyInput: "",
        isEditing: true,
      })
    ).toEqual({
      displayValue: "",
      placeholder: "e.g. sk-...",
      showsSavedMask: false,
    });
  });
});
