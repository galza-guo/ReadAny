import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import settingsDialogSource from "./SettingsDialogContent.tsx?raw";
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
        onAddPreset={() => "preset-2"}
        onDeletePreset={() => {}}
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
        onAddPreset={() => "preset-2"}
        onDeletePreset={() => {}}
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
    expect(html).toContain("aria-label=\"Edit preset\"");
  });

  test("renders an empty-state prompt when no presets exist", () => {
    const html = renderToStaticMarkup(
      <SettingsDialogContent
        settings={{
          theme: "system",
          activePresetId: "",
          defaultLanguage: { code: "zh-CN", label: "Chinese (Simplified)" },
          presets: [],
        }}
        activePreset={undefined}
        presetApiKeyInput=""
        presetStatuses={{}}
        presetSaving={false}
        presetModelsLoading={false}
        testAllRunning={false}
        presetModels={{}}
        onSettingsChange={() => {}}
        onAddPreset={() => "preset-1"}
        onDeletePreset={() => {}}
        onPresetSelect={() => {}}
        onPresetChange={() => {}}
        onPresetApiKeyInputChange={() => {}}
        onSaveSettings={() => {}}
        onFetchPresetModels={() => {}}
        onTestPreset={() => {}}
        onTestAllPresets={() => {}}
      />
    );

    expect(html).toContain("No presets yet");
    expect(html).toContain("Add your first preset");
  });

  test("renders delete affordances for saved presets", () => {
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
        onAddPreset={() => "preset-2"}
        onDeletePreset={() => {}}
        onPresetSelect={() => {}}
        onPresetChange={() => {}}
        onPresetApiKeyInputChange={() => {}}
        onSaveSettings={() => {}}
        onFetchPresetModels={() => {}}
        onTestPreset={() => {}}
        onTestAllPresets={() => {}}
      />
    );

    expect(html).toContain("aria-label=\"Delete preset\"");
    expect(html).toContain('class="btn btn-icon-only btn-quiet-action settings-icon-button"');
    expect(
      html
    ).toContain(
      'class="btn btn-icon-only btn-quiet-action settings-icon-button settings-icon-button-danger"'
    );
  });

  test("renders model presets heading without redundant row badges or subtitles", () => {
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
        onAddPreset={() => "preset-2"}
        onDeletePreset={() => {}}
        onPresetSelect={() => {}}
        onPresetChange={() => {}}
        onPresetApiKeyInputChange={() => {}}
        onSaveSettings={() => {}}
        onFetchPresetModels={() => {}}
        onTestPreset={() => {}}
        onTestAllPresets={() => {}}
      />
    );

    expect(html).toContain("Model Presets");
    expect(html).toContain('class="settings-toolbar-title type-section-title"');
    expect(html).toContain('class="settings-label type-field-label"');
    expect(html).toContain('class="btn btn-small btn-quiet-action"');
    expect(html).toContain(">Test all<");
    expect(html).toContain('class="btn btn-icon-only btn-quiet-action settings-icon-button"');
    expect(html).not.toContain(">Active<");
    expect(html.match(/OpenRouter/g)?.length ?? 0).toBe(1);
  });

  test("uses the quiet action style for add and test, while save is primary", () => {
    expect(settingsDialogSource).toContain('className="btn btn-icon-only btn-quiet-action settings-icon-button"');
    expect(settingsDialogSource).toContain('className="btn btn-primary"');
    expect(settingsDialogSource).toContain('className="btn btn-quiet-action"');
    expect(settingsDialogSource).toContain('{presetSaving ? "Saving..." : "Save"}');
    expect(settingsDialogSource).toContain("onClick={onTestPreset}");
  });

  test("keeps the api key field in a masked saved-key state until the user edits it", () => {
    expect(settingsDialogSource).toContain("getPresetApiKeyFieldState");
    expect(settingsDialogSource).toContain("placeholder={apiKeyFieldState?.placeholder}");
    expect(settingsDialogSource).toContain('value={apiKeyFieldState?.displayValue ?? ""}');
  });

  test("renders a saved custom default language label", () => {
    const html = renderToStaticMarkup(
      <SettingsDialogContent
        settings={{
          theme: "system",
          activePresetId: "",
          defaultLanguage: {
            code: "custom:hong-kong-traditional-chinese",
            label: "Hong Kong Traditional Chinese",
          },
          presets: [],
        }}
        activePreset={undefined}
        presetApiKeyInput=""
        presetStatuses={{}}
        presetSaving={false}
        presetModelsLoading={false}
        testAllRunning={false}
        presetModels={{}}
        onSettingsChange={() => {}}
        onAddPreset={() => "preset-1"}
        onDeletePreset={() => {}}
        onPresetSelect={() => {}}
        onPresetChange={() => {}}
        onPresetApiKeyInputChange={() => {}}
        onSaveSettings={() => {}}
        onFetchPresetModels={() => {}}
        onTestPreset={() => {}}
        onTestAllPresets={() => {}}
      />
    );

    expect(html).toContain("Hong Kong Traditional Chinese");
  });
});
