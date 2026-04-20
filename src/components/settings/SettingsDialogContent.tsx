import { useMemo, useState } from "react";
import * as Label from "@radix-ui/react-label";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as Select from "@radix-ui/react-select";
import { canListModels } from "../../lib/providerForm";
import {
  LANGUAGE_PRESETS,
  PRESET_PROVIDER_OPTIONS,
} from "../../lib/appSettings";
import type {
  PresetTestResult,
  TranslationPreset,
  TranslationProviderKind,
  TranslationSettings,
} from "../../types";

export type SettingsDialogContentProps = {
  settings: TranslationSettings;
  activePreset?: TranslationPreset;
  presetApiKeyInput: string;
  presetStatuses: Record<string, PresetTestResult | undefined>;
  presetSaving: boolean;
  presetModelsLoading: boolean;
  testAllRunning: boolean;
  presetModels: Record<string, string[]>;
  onSettingsChange: (settings: TranslationSettings) => void;
  onAddPreset: (providerKind: TranslationProviderKind) => void;
  onPresetSelect: (presetId: string) => void;
  onPresetChange: (preset: TranslationPreset) => void;
  onPresetApiKeyInputChange: (apiKey: string) => void;
  onSaveSettings: () => void;
  onFetchPresetModels: () => void;
  onTestPreset: () => void;
  onTestAllPresets: () => void;
};

export function SettingsDialogContent({
  settings,
  activePreset,
  presetApiKeyInput,
  presetStatuses,
  presetSaving,
  presetModelsLoading,
  testAllRunning,
  presetModels,
  onSettingsChange,
  onAddPreset,
  onPresetSelect,
  onPresetChange,
  onPresetApiKeyInputChange,
  onSaveSettings,
  onFetchPresetModels,
  onTestPreset,
  onTestAllPresets,
}: SettingsDialogContentProps) {
  const [newPresetKind, setNewPresetKind] =
    useState<TranslationProviderKind>("openrouter");
  const [expandedPresetId, setExpandedPresetId] = useState<string | null>(null);

  const fetchedModels = activePreset ? presetModels[activePreset.id] ?? [] : [];
  const selectedPresetStatus = activePreset
    ? presetStatuses[activePreset.id]
    : undefined;
  const canFetchModels = activePreset
    ? canListModels({
        kind: activePreset.providerKind,
        baseUrl: activePreset.baseUrl,
        apiKey: presetApiKeyInput,
        apiKeyConfigured: activePreset.apiKeyConfigured,
      })
    : false;

  const languageValue = useMemo(
    () => settings.defaultLanguage.code,
    [settings.defaultLanguage.code]
  );

  return (
    <div className="settings-layout">
      <div className="settings-block settings-block-inline">
        <Label.Root className="settings-label" htmlFor="default-language-select">
          Default language
        </Label.Root>
        <div className="settings-inline-control">
          <Select.Root
            value={languageValue}
            onValueChange={(value) => {
              const nextLanguage =
                LANGUAGE_PRESETS.find((preset) => preset.code === value) ??
                settings.defaultLanguage;
              onSettingsChange({
                ...settings,
                defaultLanguage: nextLanguage,
              });
            }}
          >
            <Select.Trigger className="select-trigger" id="default-language-select">
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="select-content settings-select-content" position="popper">
                <Select.Viewport>
                  {LANGUAGE_PRESETS.map((preset) => (
                    <Select.Item
                      key={preset.code}
                      value={preset.code}
                      className="select-item"
                    >
                      <Select.ItemText>{preset.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
      </div>

      <div className="settings-block">
        <div className="settings-toolbar">
          <div className="settings-toolbar-left">
            <span className="settings-toolbar-title">Saved presets</span>
            <Select.Root
              value={newPresetKind}
              onValueChange={(value) =>
                setNewPresetKind(value as TranslationProviderKind)
              }
            >
              <Select.Trigger className="select-trigger" id="new-preset-kind">
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="select-content settings-select-content" position="popper">
                  <Select.Viewport>
                    {PRESET_PROVIDER_OPTIONS.map((provider) => (
                      <Select.Item
                        key={provider.value}
                        value={provider.value}
                        className="select-item"
                      >
                        <Select.ItemText>{provider.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
            <button
              className="btn btn-ghost btn-small"
              onClick={() => onAddPreset(newPresetKind)}
              type="button"
            >
              Add
            </button>
          </div>
          <button
            className="btn btn-ghost btn-small"
            disabled={settings.presets.length === 0 || testAllRunning}
            onClick={onTestAllPresets}
            type="button"
          >
            {testAllRunning ? "Testing..." : "Test all"}
          </button>
        </div>

        <ScrollArea.Root className="settings-preset-scroll settings-preset-scroll-flat">
          <ScrollArea.Viewport className="settings-preset-list">
            {settings.presets.map((preset) => {
              const status = presetStatuses[preset.id];
              const isSelected = preset.id === settings.activePresetId;
              const isExpanded = expandedPresetId === preset.id && isSelected;
              const providerLabel =
                PRESET_PROVIDER_OPTIONS.find(
                  (option) => option.value === preset.providerKind
                )?.label ?? preset.providerKind;

              return (
                <div
                  key={preset.id}
                  className={`settings-preset-item settings-preset-item--expandable ${
                    isSelected ? "is-selected" : ""
                  }`}
                >
                  <div className="settings-preset-row">
                    <button
                      className="settings-preset-main"
                      onClick={() => onPresetSelect(preset.id)}
                      type="button"
                    >
                      <div className="settings-preset-copy">
                        <span className="settings-preset-label">{preset.label}</span>
                        <span className="settings-preset-meta">
                          {isSelected ? "Active preset" : providerLabel}
                        </span>
                      </div>
                    </button>
                    <div className="settings-preset-actions">
                      {isSelected ? (
                        <span className="settings-preset-badge">Active</span>
                      ) : null}
                      {status ? (
                        <span
                          className={`settings-preset-badge ${
                            status.ok ? "is-ok" : "is-error"
                          }`}
                        >
                          {status.ok ? "OK" : "Issue"}
                        </span>
                      ) : null}
                      <button
                        className="btn btn-ghost btn-small"
                        onClick={() => {
                          onPresetSelect(preset.id);
                          setExpandedPresetId((current) =>
                            current === preset.id ? null : preset.id
                          );
                        }}
                        type="button"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {isExpanded && activePreset ? (
                    <div className="settings-preset-editor">
                      <div className="settings-item">
                        <Label.Root
                          className="settings-label"
                          htmlFor="preset-provider-kind"
                        >
                          Provider
                        </Label.Root>
                        <Select.Root
                          value={activePreset.providerKind}
                          onValueChange={(value) =>
                            onPresetChange({
                              ...activePreset,
                              providerKind: value as TranslationProviderKind,
                            })
                          }
                        >
                          <Select.Trigger
                            className="select-trigger"
                            id="preset-provider-kind"
                          >
                            <Select.Value />
                          </Select.Trigger>
                          <Select.Portal>
                            <Select.Content
                              className="select-content settings-select-content"
                              position="popper"
                            >
                              <Select.Viewport>
                                {PRESET_PROVIDER_OPTIONS.map((provider) => (
                                  <Select.Item
                                    key={provider.value}
                                    value={provider.value}
                                    className="select-item"
                                  >
                                    <Select.ItemText>{provider.label}</Select.ItemText>
                                  </Select.Item>
                                ))}
                              </Select.Viewport>
                            </Select.Content>
                          </Select.Portal>
                        </Select.Root>
                      </div>

                      {activePreset.providerKind === "openai-compatible" ? (
                        <div className="settings-item">
                          <Label.Root
                            className="settings-label"
                            htmlFor="preset-base-url"
                          >
                            Base URL
                          </Label.Root>
                          <input
                            id="preset-base-url"
                            className="input"
                            placeholder="https://api.example.com/v1"
                            value={activePreset.baseUrl || ""}
                            onChange={(event) =>
                              onPresetChange({
                                ...activePreset,
                                baseUrl: event.target.value,
                              })
                            }
                          />
                        </div>
                      ) : null}

                      <div className="settings-item">
                        <div className="settings-inline-row">
                          <Label.Root className="settings-label" htmlFor="preset-model">
                            Model
                          </Label.Root>
                          <button
                            className="btn btn-ghost btn-small"
                            disabled={!canFetchModels || presetModelsLoading}
                            onClick={onFetchPresetModels}
                            type="button"
                          >
                            {presetModelsLoading ? "Loading..." : "Load models"}
                          </button>
                        </div>

                        {fetchedModels.length > 0 ? (
                          <Select.Root
                            value={activePreset.model}
                            onValueChange={(value) =>
                              onPresetChange({
                                ...activePreset,
                                model: value,
                              })
                            }
                          >
                            <Select.Trigger
                              className="select-trigger"
                              aria-label="Preset model"
                            >
                              <Select.Value placeholder="Choose a model" />
                            </Select.Trigger>
                            <Select.Portal>
                              <Select.Content
                                className="select-content settings-select-content"
                                position="popper"
                              >
                                <Select.Viewport>
                                  {fetchedModels.map((model) => (
                                    <Select.Item
                                      key={model}
                                      value={model}
                                      className="select-item"
                                    >
                                      <Select.ItemText>{model}</Select.ItemText>
                                    </Select.Item>
                                  ))}
                                </Select.Viewport>
                              </Select.Content>
                            </Select.Portal>
                          </Select.Root>
                        ) : null}

                        <input
                          id="preset-model"
                          className="input"
                          value={activePreset.model}
                          onChange={(event) =>
                            onPresetChange({
                              ...activePreset,
                              model: event.target.value,
                            })
                          }
                          placeholder="Enter a model ID manually"
                        />
                      </div>

                      <div className="settings-item">
                        <Label.Root className="settings-label" htmlFor="preset-api-key">
                          API key
                        </Label.Root>
                        <input
                          id="preset-api-key"
                          className="input"
                          type="password"
                          placeholder={
                            activePreset.providerKind === "openai-compatible"
                              ? "Optional"
                              : "Enter API key"
                          }
                          value={presetApiKeyInput}
                          onChange={(event) =>
                            onPresetApiKeyInputChange(event.target.value)
                          }
                        />
                        <div className="api-key-status">
                          {activePreset.apiKeyConfigured ? (
                            <span className="status-ok">Key saved</span>
                          ) : (
                            <span className="status-warn">No key saved</span>
                          )}
                          {presetApiKeyInput.trim() ? (
                            <span className="status-message">Unsaved key entered</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="settings-actions-row">
                        <button
                          className="btn btn-primary"
                          disabled={presetSaving}
                          onClick={onSaveSettings}
                          type="button"
                        >
                          {presetSaving ? "Saving..." : "Save"}
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={onTestPreset}
                          type="button"
                        >
                          Test
                        </button>
                      </div>

                      {selectedPresetStatus ? (
                        <div className="api-key-status">
                          <span
                            className={selectedPresetStatus.ok ? "status-ok" : "status-warn"}
                          >
                            {selectedPresetStatus.ok ? "OK" : "Issue"}
                          </span>
                          <span className="status-message">
                            {selectedPresetStatus.message}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" className="scrollbar">
            <ScrollArea.Thumb className="scrollbar-thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </div>
    </div>
  );
}
