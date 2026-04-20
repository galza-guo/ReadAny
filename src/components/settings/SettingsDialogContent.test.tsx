import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import settingsDialogSource from "./SettingsDialogContent.tsx?raw";
import { SettingsDialogContent } from "./SettingsDialogContent";

const settingsStylesSource = readFileSync(
  resolve(import.meta.dir, "..", "..", "App.css"),
  "utf8"
);

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
        onDiscardPresetEdits={() => {}}
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
        onDiscardPresetEdits={() => {}}
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
        onDiscardPresetEdits={() => {}}
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
        onDiscardPresetEdits={() => {}}
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
        onDiscardPresetEdits={() => {}}
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

  test("uses quiet actions for add and test, while save is a bold text action", () => {
    expect(settingsDialogSource).toContain('className="btn btn-icon-only btn-quiet-action settings-icon-button"');
    expect(settingsDialogSource).toContain('className="settings-save-action"');
    expect(settingsDialogSource).not.toContain('className="btn btn-primary"');
    expect(settingsDialogSource).toContain('className="btn btn-quiet-action"');
    expect(settingsDialogSource).toContain("onClick={onTestPreset}");
  });

  test("keeps the api key field in a masked saved-key state until the user edits it", () => {
    expect(settingsDialogSource).toContain("getPresetApiKeyFieldState");
    expect(settingsDialogSource).toContain("placeholder={apiKeyFieldState?.placeholder}");
    expect(settingsDialogSource).toContain('value={apiKeyFieldState?.displayValue ?? ""}');
  });

  test("puts API key before model and uses one searchable model field", () => {
    expect(settingsDialogSource.indexOf('htmlFor="preset-api-key"')).toBeLessThan(
      settingsDialogSource.indexOf('htmlFor="preset-model"')
    );
    expect(settingsDialogSource).toContain("model-combobox");
    expect(settingsDialogSource).not.toContain('Select.Value placeholder="Choose a model"');
    expect(settingsDialogSource).not.toContain('aria-label="Preset model"');
  });

  test("keeps only the preset-row success tick and uses a plain check for saved state", () => {
    expect(settingsDialogSource).not.toContain("Saved key on file");
    expect(settingsDialogSource).not.toContain('{status.ok ? "OK" : "Issue"}');
    expect(settingsDialogSource).toContain("settings-preset-success");
    expect(settingsDialogSource).toContain("settings-action-status");
    expect(settingsDialogSource).toContain("activePresetIsSaved && !presetSaving");
    expect(settingsDialogSource).not.toContain('aria-label="Test passed"');
    expect(settingsDialogSource).toContain("function CheckIcon()");
  });

  test("discards unsaved preset edits when the user exits edit mode", () => {
    expect(settingsDialogSource).toContain("onDiscardPresetEdits");
    expect(settingsDialogSource).toContain("discardExpandedPreset");
    expect(settingsDialogSource).toContain("if (expandedPresetId && expandedPresetId !== presetId)");
  });

  test("clicking the preset name uses the same edit toggle behavior as the edit button", () => {
    expect(settingsDialogSource).toContain("togglePresetEditor");
    expect(settingsDialogSource).toContain("onClick={() => togglePresetEditor(preset.id)}");
  });

  test("shows an animated testing indicator beside the test button while a preset test is running", () => {
    expect(settingsDialogSource).toContain("presetTestRunning");
    expect(settingsDialogSource).toContain("settings-action-pending");
    expect(settingsDialogSource).toContain("settings-action-ellipsis");
    expect(settingsDialogSource).toContain('aria-label="Testing in progress"');
  });

  test("does not draw an extra separator line when a preset expands", () => {
    expect(settingsStylesSource).not.toMatch(/\.settings-preset-editor\s*\{[^}]*border-top:/s);
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
        onDiscardPresetEdits={() => {}}
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
