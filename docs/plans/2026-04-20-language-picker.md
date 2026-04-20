# Language Picker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the simple default-language dropdown with a broader searchable language picker that supports common languages, a long all-languages list, and custom language fallback.

**Architecture:** Move language-list logic into frontend helpers so the UI can render common and full language sections consistently, then replace the Radix select with a focused searchable popover-based picker. Keep the existing `TargetLanguage` shape and only tweak backend prompt formatting so custom languages are passed to the LLM in a natural way while cache keys remain stable.

**Tech Stack:** React, TypeScript, Radix Popover, Bun tests, Rust backend prompt helpers, Vite build

---

### Task 1: Lock the new language behavior in tests

**Files:**
- Modify: `src/lib/appSettings.test.ts`
- Modify: `src/components/settings/SettingsDialogContent.test.tsx`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Write the failing frontend helper tests**

- Add tests for:
  - broader built-in language coverage
  - custom language creation from free text
  - common-language ordering behavior

**Step 2: Run the helper test to verify it fails**

Run: `npx bun@1.3.6 test src/lib/appSettings.test.ts`

**Step 3: Write the failing settings UI tests**

- Add tests that assert:
  - the default-language control renders a searchable input shell
  - the picker supports custom language fallback text

**Step 4: Run the settings UI test to verify it fails**

Run: `npx bun@1.3.6 test src/components/settings/SettingsDialogContent.test.tsx`

**Step 5: Write the failing backend prompt test**

- Add a small unit test for custom language prompt formatting.

**Step 6: Run the Rust test to verify it fails**

Run: `cargo test custom_language`

### Task 2: Expand the language model on the frontend

**Files:**
- Modify: `src/lib/appSettings.ts`
- Modify: `src/types.ts` only if absolutely necessary

**Step 1: Add larger built-in language data**

- Introduce:
  - `COMMON_LANGUAGE_PRESETS`
  - a much broader language list for the full picker

**Step 2: Add helper functions**

- Add helpers for:
  - matching and filtering languages
  - generating stable custom language entries
  - detecting whether a language is built-in or custom

**Step 3: Run the helper tests**

Run: `npx bun@1.3.6 test src/lib/appSettings.test.ts`

### Task 3: Replace the default-language select with a searchable picker

**Files:**
- Modify: `src/components/settings/SettingsDialogContent.tsx`
- Modify: `src/App.css`

**Step 1: Replace the current default-language Radix select**

- Use a popover-style picker with:
  - inline search input
  - auto-focus on open
  - common and full sections
  - custom language fallback action

**Step 2: Preserve current settings updates**

- Selecting a built-in or custom language should still call `onSettingsChange` with a valid `TargetLanguage`.

**Step 3: Add visual polish**

- Keep the dropdown overlaying cleanly above the settings sheet.
- Make the search input feel immediate and unobtrusive.

**Step 4: Run the focused settings UI test**

Run: `npx bun@1.3.6 test src/components/settings/SettingsDialogContent.test.tsx`

### Task 4: Keep backend prompts friendly for custom languages

**Files:**
- Modify: `src-tauri/src/lib.rs`

**Step 1: Add a prompt-format helper**

- Use the custom language label in prompt text when the code is app-generated for a custom language.

**Step 2: Keep cache keys stable**

- Continue using the `code` for cache/storage semantics.

**Step 3: Run the Rust test**

Run: `cargo test custom_language`

### Task 5: Verify the full change

**Files:**
- Modify only as needed based on failures

**Step 1: Run the focused frontend tests**

Run:
`npx bun@1.3.6 test src/lib/appSettings.test.ts src/components/settings/SettingsDialogContent.test.tsx`

**Step 2: Run the Rust verification**

Run:
`cargo test custom_language`

**Step 3: Run the production build**

Run:
`npx bun@1.3.6 run build`

**Step 4: Start the local app for manual inspection if needed**

Run:
`npx bun@1.3.6 run dev -- --host 127.0.0.1 --port 4174`
