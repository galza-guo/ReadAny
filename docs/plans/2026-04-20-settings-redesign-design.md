# Settings Redesign Design

**Date:** 2026-04-20

## Goal

Redesign the reader settings dialog so it feels calm and intentional instead of dense and over-framed, while keeping the existing translation preset functionality intact.

## Approved Direction

- Use a minimal vertical list for presets.
- Remove the provider picker from the section header.
- Replace the text `Add` control with a `+` icon button.
- Add presets by creating a new draft row immediately and expanding it into edit mode.
- Add delete actions to preset rows.
- Ship no starter presets for brand-new users.
- Preserve already saved user presets and API keys.
- When no presets exist, show an elegant empty state that prompts the user to add the first preset.
- Reduce top padding above the dialog title.
- Remove the extra settings description text under `Settings`.
- Remove the inner scrolling settings pane that causes layout jitter.

## UX Shape

### Dialog shell

- Keep `Settings` as the only visible heading.
- Tighten top spacing inside the dialog.
- Let the dialog itself own any needed overflow, instead of a nested scroll area inside the settings body.

### Default language

- Render as one simple row.
- Keep the label on the left and the language select on the right.
- Keep the select menu portaled so it overlays cleanly above the dialog.

### Presets section

- Use a quiet section header with:
  - `Presets` label
  - `+` icon button on the right
- No provider dropdown in the header.
- The add action creates a new preset draft, sets it active, and opens it inline for editing.

### Preset rows

- Each row shows:
  - generated preset name
  - small secondary provider/status line
  - `Active` chip when selected
  - icon-only `Edit` and `Delete` actions
- Clicking a row selects it.
- Clicking `Edit` expands only that row.
- Expanded content stays inline under the row, not in a separate panel.

### Empty state

- When the preset list is empty:
  - show a short, elegant empty-state message
  - show a clear add-first-preset action
- The empty state replaces the list instead of showing placeholder presets.

## Data and behavior changes

- Frontend default settings should start with:
  - `presets: []`
  - `activePresetId: ""`
- Rust app settings normalization should allow an empty preset list and an empty active preset id.
- Legacy migration should still preserve and migrate old saved provider data, but it should not invent a starter preset when no real provider config exists.
- Deleting presets should:
  - remove the preset status entry
  - remove any unsaved API-key draft for that preset
  - choose the next active preset if one remains
  - leave `activePresetId` empty when the last preset is deleted

## Testing

- Frontend unit tests:
  - default settings start empty
  - settings dialog renders empty-state prompt when no presets exist
  - settings dialog exposes add and delete affordances
- Rust tests:
  - default app settings are empty
  - normalization preserves empty preset state
  - legacy migration without providers stays empty

