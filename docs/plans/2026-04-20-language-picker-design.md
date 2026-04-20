# Language Picker Design

**Date:** 2026-04-20

## Goal

Expand the default-language picker so the app supports a much broader set of target languages without blocking what the LLM can translate, while keeping the interaction fast for common choices.

## Approved Direction

- Replace the current fixed select with a searchable combobox-like picker.
- Clicking the control should open the menu immediately and focus a text input with a blinking cursor.
- The opened menu should already show top suggestions before the user types.
- The list should be split into:
  - `Common languages`
  - `All languages`
- Typing should filter the list live.
- If no exact match exists, the user can choose a custom language using the text they entered.
- The user only types one custom language name; the app handles the saved internal code automatically.

## UX Shape

### Open behavior

When the user clicks `Default language`:

- the picker opens immediately
- the text field is focused automatically
- the cursor is visible right away
- common languages are already visible, so the user can either click or start typing

### Browse behavior

With an empty query:

- show `Common languages` first
- show a longer `All languages` section below
- allow scrolling through the full list

### Search behavior

As the user types:

- filter results across the full built-in list
- keep the interaction immediate and lightweight
- preserve keyboard navigation with arrows, enter, and escape

### Custom language behavior

If the user types a language or variant that is not in the built-in list, show a final option like:

- `Use custom language: Hong Kong Traditional Chinese`

When selected:

- save the exact typed string as the language label
- generate a stable internal code from that label for caching and persistence
- keep the saved custom language reusable later

## Data model

The app should ship with:

- a larger built-in language list that covers most base languages plus important variants
- a separate `common` subset used for the top section

Custom languages should still fit the existing `TargetLanguage` shape:

- `label`: exact user-facing text
- `code`: stable generated key such as a slugged custom identifier

## Backend prompt behavior

The app already passes `label` and `code` to the translation prompt, so the LLM is already doing the actual target-language work. The only backend adjustment needed is to keep custom languages prompt-friendly by preferring the custom label when generating prompt text, while still using the stable code for cache keys.

## Files likely involved

- `src/lib/appSettings.ts`
- `src/components/settings/SettingsDialogContent.tsx`
- `src/App.css`
- `src/types.ts`
- `src-tauri/src/lib.rs`

## Testing

- frontend helper tests for:
  - larger built-in list
  - common language grouping
  - custom language generation and normalization
- settings UI tests for:
  - searchable picker shell
  - custom fallback option text
- backend tests for:
  - prompt rendering with custom languages

