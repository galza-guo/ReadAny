# Settings Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the settings dialog into a minimal preset list with empty-by-default settings, inline editing, delete actions, and a calmer dialog shell.

**Architecture:** Update the frontend settings helpers and dialog component so empty presets are a first-class state, then align Rust app-settings normalization and migration so saved settings remain stable and new users do not receive seeded presets. Keep preset editing inline and move overflow ownership from the inner settings body to the dialog shell.

**Tech Stack:** React, TypeScript, Radix UI, Bun tests, Rust app settings, Tauri commands

---

### Task 1: Lock empty-preset behavior in tests

**Files:**
- Modify: `src/lib/appSettings.test.ts`
- Modify: `src/components/settings/SettingsDialogContent.test.tsx`
- Modify: `src-tauri/src/app_settings.rs`

**Step 1: Write the failing frontend helper tests**

- Add a test asserting `createDefaultSettings()` returns `presets: []` and `activePresetId: ""`.

**Step 2: Run the focused helper test to verify it fails**

Run: `npx bun@1.3.6 test src/lib/appSettings.test.ts`

**Step 3: Write the failing settings dialog tests**

- Add a test asserting the empty-state prompt renders when no presets exist.
- Add a test asserting delete affordances are rendered for preset rows.

**Step 4: Run the focused dialog test to verify it fails**

Run: `npx bun@1.3.6 test src/components/settings/SettingsDialogContent.test.tsx`

**Step 5: Write the failing Rust settings tests**

- Add tests for empty defaults and empty normalization.

**Step 6: Run the focused Rust test to verify it fails**

Run: `cargo test app_settings`

### Task 2: Make empty presets a valid saved state

**Files:**
- Modify: `src/lib/appSettings.ts`
- Modify: `src/types.ts`
- Modify: `src-tauri/src/app_settings.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Update frontend settings helpers**

- Make `createDefaultSettings()` return an empty list and empty active preset id.
- Keep `getActivePreset()` returning `undefined` when there are no presets.

**Step 2: Update Rust defaults and normalization**

- Stop injecting a default OpenRouter preset in `AppSettings::default()`.
- Stop forcing a default preset inside `AppSettings::normalized()`.
- Keep active preset id empty when no presets exist.
- Preserve real migrated presets from legacy config.

**Step 3: Update any fallback paths that still assume a preset always exists**

- Remove or narrow frontend fallback code that substitutes `settings.presets[0]`.
- Keep existing translation actions guarded when no preset exists.

**Step 4: Run focused tests**

Run:
- `npx bun@1.3.6 test src/lib/appSettings.test.ts`
- `cargo test app_settings`

### Task 3: Redesign the settings dialog structure

**Files:**
- Modify: `src/components/settings/SettingsDialogContent.tsx`
- Modify: `src/App.css`
- Modify: `src/App.tsx`

**Step 1: Simplify the dialog shell**

- Remove the description under the dialog title.
- Reduce top padding in the dialog content.
- Move scrolling responsibility off the inner `.settings-layout`.

**Step 2: Simplify the presets section header**

- Replace the header provider dropdown with a `+` icon button.
- Keep the section title concise.

**Step 3: Add a proper empty state**

- Render an elegant “no presets yet” message and add-first action when the list is empty.

**Step 4: Redesign rows and actions**

- Use lightweight rows with subtle separators.
- Add icon-only edit and delete buttons.
- Keep active state and status chips restrained.
- Continue expanding editor content inline inside the row.

**Step 5: Auto-expand new presets**

- When the add button is used, create a new draft preset, make it active, and open it immediately in edit mode.

**Step 6: Add delete flow**

- Add a delete action for preset rows.
- Confirm before removing the preset.

**Step 7: Run the focused dialog test**

Run: `npx bun@1.3.6 test src/components/settings/SettingsDialogContent.test.tsx`

### Task 4: Wire preset deletion through app state

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/settings/SettingsDialogContent.tsx`

**Step 1: Add a delete handler in app state**

- Remove the target preset.
- Clear related status and API-key draft state.
- Choose the next active preset or empty id.

**Step 2: Pass the handler into the settings dialog**

- Expose delete behavior to the row actions.

**Step 3: Re-run focused frontend tests**

Run:
- `npx bun@1.3.6 test src/lib/appSettings.test.ts src/components/settings/SettingsDialogContent.test.tsx`

### Task 5: Verify the full change

**Files:**
- Modify only as needed based on failures

**Step 1: Run the focused frontend suite**

Run:
`npx bun@1.3.6 test src/components/settings/SettingsDialogContent.test.tsx src/lib/appSettings.test.ts src/lib/providerForm.test.ts`

**Step 2: Run the Rust settings tests**

Run:
`cargo test app_settings`

**Step 3: Run the production build**

Run:
`npx bun@1.3.6 run build`

**Step 4: Manually open the app locally if needed**

Run:
`npx bun@1.3.6 run dev -- --host 127.0.0.1 --port 4173`
