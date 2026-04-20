import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { SettingsDialogContent } from "./SettingsDialogContent";

describe("SettingsDialogContent", () => {
  test("renders one default language label and no helper note", () => {
    const html = renderToStaticMarkup(
      <SettingsDialogContent
        settings={{
          theme: "system",
          activePresetId: "preset-1",
          defaultLanguage: { code: "zh-CN", label: "Chinese (Simplified)" },
          presets: [
            {
              id: "preset-1",
              label: "OpenRouter · openai/gpt-4o-mini",
              providerKind: "openrouter",
              model: "openai/gpt-4o-mini",
            },
          ],
        }}
        activePreset={{
          id: "preset-1",
          label: "OpenRouter · openai/gpt-4o-mini",
          providerKind: "openrouter",
          model: "openai/gpt-4o-mini",
        }}
        presetApiKeyInput=""
        presetStatuses={{}}
        presetSaving={false}
        presetModelsLoading={false}
        testAllRunning={false}
        presetModels={{}}
        onSettingsChange={() => {}}
        onAddPreset={() => {}}
        onPresetSelect={() => {}}
        onPresetChange={() => {}}
        onPresetApiKeyInputChange={() => {}}
        onSaveSettings={() => {}}
        onFetchPresetModels={() => {}}
        onTestPreset={() => {}}
        onTestAllPresets={() => {}}
      />
    );

    expect(html.match(/Default language/g)?.length ?? 0).toBe(1);
    expect(html).not.toContain("New translations use this language by default.");
  });

  test("renders inline preset editing instead of a separate preset details section", () => {
    const html = renderToStaticMarkup(
      <SettingsDialogContent
        settings={{
          theme: "system",
          activePresetId: "preset-1",
          defaultLanguage: { code: "zh-CN", label: "Chinese (Simplified)" },
          presets: [
            {
              id: "preset-1",
              label: "OpenRouter · openai/gpt-4o-mini",
              providerKind: "openrouter",
              model: "openai/gpt-4o-mini",
            },
          ],
        }}
        activePreset={{
          id: "preset-1",
          label: "OpenRouter · openai/gpt-4o-mini",
          providerKind: "openrouter",
          model: "openai/gpt-4o-mini",
        }}
        presetApiKeyInput=""
        presetStatuses={{}}
        presetSaving={false}
        presetModelsLoading={false}
        testAllRunning={false}
        presetModels={{}}
        onSettingsChange={() => {}}
        onAddPreset={() => {}}
        onPresetSelect={() => {}}
        onPresetChange={() => {}}
        onPresetApiKeyInputChange={() => {}}
        onSaveSettings={() => {}}
        onFetchPresetModels={() => {}}
        onTestPreset={() => {}}
        onTestAllPresets={() => {}}
      />
    );

    expect(html).not.toContain("Preset details");
    expect(html).toContain("Edit");
  });
});
