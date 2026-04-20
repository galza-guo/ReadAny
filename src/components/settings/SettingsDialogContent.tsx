import { useMemo, useState } from "react";
import * as Label from "@radix-ui/react-label";
import * as Select from "@radix-ui/react-select";
import { ConfirmationDialog } from "../ConfirmationDialog";
import { LanguageCombobox } from "./LanguageCombobox";
import { canListModels } from "../../lib/providerForm";
import {
  getDefaultModelForProvider,
  getPresetApiKeyFieldState,
  getPresetValidationState,
  getProviderOptionLabel,
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
  testAllDisabled?: boolean;
  presetModels: Record<string, string[]>;
  onSettingsChange: (settings: TranslationSettings) => void;
  onAddPreset: () => string;
  onDeletePreset: (presetId: string) => void;
  onPresetSelect: (presetId: string) => void;
  onPresetChange: (preset: TranslationPreset) => void;
  onPresetApiKeyInputChange: (apiKey: string) => void;
  onSaveSettings: () => void | Promise<void>;
  onFetchPresetModels: () => void;
  onTestPreset: () => void;
  onTestAllPresets: () => void;
};

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="m16.5 3.5 4 4L7 21l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function SettingsDialogContent({
  settings,
  activePreset,
  presetApiKeyInput,
  presetStatuses,
  presetSaving,
  presetModelsLoading,
  testAllRunning,
  testAllDisabled = false,
  presetModels,
  onSettingsChange,
  onAddPreset,
  onDeletePreset,
  onPresetSelect,
  onPresetChange,
  onPresetApiKeyInputChange,
  onSaveSettings,
  onFetchPresetModels,
  onTestPreset,
  onTestAllPresets,
}: SettingsDialogContentProps) {
  const [expandedPresetId, setExpandedPresetId] = useState<string | null>(null);
  const [apiKeyEditingPresetId, setApiKeyEditingPresetId] = useState<string | null>(null);
  const [pendingDeletePresetId, setPendingDeletePresetId] = useState<string | null>(null);

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

  const pendingDeletePreset = pendingDeletePresetId
    ? settings.presets.find((preset) => preset.id === pendingDeletePresetId)
    : undefined;
  const activePresetValidation = useMemo(
    () =>
      activePreset
        ? getPresetValidationState(activePreset, presetApiKeyInput)
        : undefined,
    [activePreset, presetApiKeyInput]
  );
  const apiKeyFieldState = activePreset
    ? getPresetApiKeyFieldState({
        apiKeyConfigured: activePreset.apiKeyConfigured,
        apiKeyInput: presetApiKeyInput,
        isEditing: apiKeyEditingPresetId === activePreset.id,
      })
    : undefined;
  const modelPlaceholder = activePreset
    ? `e.g. ${getDefaultModelForProvider(activePreset.providerKind)}`
    : "e.g. openai/gpt-4o-mini";
  const apiKeyStatus = activePreset
    ? presetApiKeyInput.trim()
      ? { className: "status-ok", label: "New key ready to save" }
      : activePreset.apiKeyConfigured
        ? { className: "status-ok", label: "Saved key on file" }
        : { className: "status-warn", label: "Required" }
    : undefined;

  return (
    <>
      <div className="settings-layout">
        <div className="settings-block settings-block-inline">
          <Label.Root className="settings-label type-field-label" htmlFor="default-language-select">
            Default language
          </Label.Root>
          <div className="settings-inline-control">
            <LanguageCombobox
              id="default-language-select"
              onChange={(nextLanguage) =>
                onSettingsChange({
                  ...settings,
                  defaultLanguage: nextLanguage,
                })
              }
              value={settings.defaultLanguage}
            />
          </div>
        </div>

        <div className="settings-block">
          <div className="settings-toolbar">
            <span className="settings-toolbar-title type-section-title">Model Presets</span>
            <div className="settings-toolbar-actions">
              {settings.presets.length > 0 ? (
                <button
                  className="btn btn-small btn-quiet-action"
                  disabled={testAllRunning || testAllDisabled}
                  onClick={onTestAllPresets}
                  type="button"
                >
                  {testAllRunning ? "Testing..." : "Test all"}
                </button>
              ) : null}
              <button
                className="btn btn-icon-only btn-quiet-action settings-icon-button"
                aria-label="Add preset"
                title="Add preset"
                onClick={() => {
                  const presetId = onAddPreset();
                  if (presetId) {
                    setExpandedPresetId(presetId);
                  }
                }}
                type="button"
              >
                <PlusIcon />
              </button>
            </div>
          </div>

          {settings.presets.length === 0 ? (
            <div className="settings-empty-state">
              <p className="settings-empty-title type-pane-title">No presets yet</p>
              <p className="settings-empty-copy type-meta">
                Add your first preset to connect a model provider.
              </p>
              <button
                className="btn"
                onClick={() => {
                  const presetId = onAddPreset();
                  if (presetId) {
                    setExpandedPresetId(presetId);
                  }
                }}
                type="button"
              >
                <PlusIcon />
                Add your first preset
              </button>
            </div>
          ) : (
            <div className="settings-preset-list">
              {settings.presets.map((preset) => {
                const status = presetStatuses[preset.id];
                const isSelected = preset.id === settings.activePresetId;
                const isExpanded = expandedPresetId === preset.id && isSelected;

                return (
                  <div
                    key={preset.id}
                    className={`settings-preset-item settings-preset-item--expandable ${
                      isSelected ? "is-selected" : ""
                    } ${isExpanded ? "is-expanded" : ""}`}
                  >
                    <div className="settings-preset-row">
                      <button
                        className="settings-preset-main"
                        onClick={() => onPresetSelect(preset.id)}
                        type="button"
                      >
                        <div className="settings-preset-copy">
                          <span className="settings-preset-label type-pane-title">{preset.label}</span>
                        </div>
                      </button>
                      <div className="settings-preset-actions">
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
                          className="btn btn-icon-only btn-quiet-action settings-icon-button"
                          aria-label="Edit preset"
                          title="Edit preset"
                          onClick={() => {
                            onPresetSelect(preset.id);
                            setExpandedPresetId((current) =>
                              current === preset.id ? null : preset.id
                            );
                          }}
                          type="button"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          className="btn btn-icon-only btn-quiet-action settings-icon-button settings-icon-button-danger"
                          aria-label="Delete preset"
                          title="Delete preset"
                          onClick={() => setPendingDeletePresetId(preset.id)}
                          type="button"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>

                    {isExpanded && activePreset ? (
                      <div className="settings-preset-editor">
                      <div className="settings-item">
                        <Label.Root
                          className="settings-label type-field-label"
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
                            aria-label="Provider"
                            id="preset-provider-kind"
                          >
                            <span>{getProviderOptionLabel(activePreset.providerKind)}</span>
                            <Select.Icon asChild>
                              <ChevronDownIcon />
                            </Select.Icon>
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
                            className="settings-label type-field-label"
                            htmlFor="preset-base-url"
                          >
                            Base URL
                          </Label.Root>
                          <input
                            id="preset-base-url"
                            className="input"
                            placeholder="e.g. https://api.example.com/v1"
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
                          <Label.Root className="settings-label type-field-label" htmlFor="preset-model">
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
                              <Select.Icon asChild>
                                <ChevronDownIcon />
                              </Select.Icon>
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
                          placeholder={modelPlaceholder}
                        />
                      </div>

                      <div className="settings-item">
                        <Label.Root className="settings-label type-field-label" htmlFor="preset-api-key">
                          API key
                        </Label.Root>
                        <input
                          id="preset-api-key"
                          className={apiKeyFieldState?.showsSavedMask ? "input input-masked" : "input"}
                          type={apiKeyFieldState?.showsSavedMask ? "text" : "password"}
                          placeholder={apiKeyFieldState?.placeholder}
                          value={apiKeyFieldState?.displayValue ?? ""}
                          onBlur={() => {
                            if (!presetApiKeyInput.trim()) {
                              setApiKeyEditingPresetId((current) =>
                                current === activePreset.id ? null : current
                              );
                            }
                          }}
                          onChange={(event) =>
                            onPresetApiKeyInputChange(event.target.value)
                          }
                          onFocus={() => setApiKeyEditingPresetId(activePreset.id)}
                        />
                        {apiKeyStatus ? (
                          <div className="api-key-status">
                            <span className={apiKeyStatus.className}>{apiKeyStatus.label}</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="settings-actions-row">
                        <button
                          className="btn btn-primary"
                          disabled={presetSaving || !activePresetValidation?.isValid}
                          onClick={() => {
                            setApiKeyEditingPresetId(null);
                            void Promise.resolve(onSaveSettings());
                          }}
                          type="button"
                        >
                          {presetSaving ? "Saving..." : "Save"}
                        </button>
                        <button
                          className="btn btn-quiet-action"
                          disabled={!activePresetValidation?.isValid}
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
            </div>
          )}
        </div>
      </div>
      <ConfirmationDialog
        actions={[
          {
            label: "Delete",
            variant: "danger",
            onSelect: () => {
              if (!pendingDeletePreset) {
                return;
              }

              if (expandedPresetId === pendingDeletePreset.id) {
                setExpandedPresetId(null);
              }
              onDeletePreset(pendingDeletePreset.id);
              setPendingDeletePresetId(null);
            },
          },
        ]}
        cancelLabel="Keep"
        description={
          pendingDeletePreset
            ? `Remove ${pendingDeletePreset.label}? You can add it again later.`
            : ""
        }
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeletePresetId(null);
          }
        }}
        open={Boolean(pendingDeletePreset)}
        title="Delete preset"
      />
    </>
  );
}
