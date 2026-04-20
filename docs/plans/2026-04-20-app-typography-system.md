# App Typography System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Introduce a small semantic typography system in `src/App.css`, create one shared rail-pane header treatment, and migrate key app surfaces onto it so the reading workspace, settings, dialogs, and home screen share one coherent type language.

**Architecture:** Keep the change lightweight and CSS-first. Define shared font-size, weight, and spacing tokens plus reusable utility classes in `src/App.css`, then move components onto those roles instead of inventing component-specific heading styles. Reuse one rail header structure for `Translation` and `AI Assistant`, and remap obvious app-wide outliers such as dialog titles, settings headings, and the home section titles.

**Tech Stack:** React 19, TypeScript, Bun tests, Tauri, Radix UI, CSS

---

### Task 1: Lock the typography contract with failing tests

**Files:**
- Modify: `src/components/TranslationPane.test.tsx`
- Modify: `src/components/reader/ChatPanel.test.tsx`
- Modify: `src/views/HomeView.test.tsx`
- Modify: `src/components/settings/SettingsDialogContent.test.tsx`

**Step 1: Write the failing test**

Add focused assertions that describe the new contract:

- `Translation` renders with a shared rail title class instead of the old page-label class
- `AI Assistant` renders with the same shared rail title class
- home `Recent` is no longer styled as a tiny uppercase label
- settings and dialog headings use shared title classes rather than isolated one-off roles

**Step 2: Run test to verify it fails**

Run:

- `bun test src/components/TranslationPane.test.tsx`
- `bun test src/components/reader/ChatPanel.test.tsx`
- `bun test src/views/HomeView.test.tsx`
- `bun test src/components/settings/SettingsDialogContent.test.tsx`

Expected: FAIL because the new shared classes do not exist yet.

**Step 3: Commit**

Do not commit yet. This refactor should stay in one working set until the shared CSS and component migration are green.

### Task 2: Add the semantic typography layer and shared rail header classes

**Files:**
- Modify: `src/App.css`

**Step 1: Write minimal implementation**

Add a small shared type system near the top of `src/App.css`:

- app title size and weight tokens
- pane title size and weight tokens
- section title size and weight tokens
- label size and weight tokens
- body and meta size tokens
- compact uppercase label tokens

Add reusable classes for:

- shared rail header layout
- rail title row
- rail pane title
- rail meta text
- section title
- field label
- meta text

Keep the system small. Do not create a large token matrix the app does not use.

**Step 2: Run a focused test sweep**

Run: `bun test src/components/reader/ChatPanel.test.tsx`

Expected: still FAIL on markup assertions until components migrate, but CSS-based expectations should now line up with the new shared system.

### Task 3: Move reading-workspace panes onto the shared rail header

**Files:**
- Modify: `src/components/TranslationPane.tsx`
- Modify: `src/components/reader/ChatPanel.tsx`
- Modify: `src/components/document/EpubNavigationSidebar.tsx`
- Modify only if needed: `src/App.css`
- Test: `src/components/TranslationPane.test.tsx`
- Test: `src/components/reader/ChatPanel.test.tsx`

**Step 1: Write minimal implementation**

Update the reader panes so:

- `Translation` uses the shared rail pane title class
- `AI Assistant` uses the same title class and header spacing
- translation status remains a secondary meta line beneath the title
- the extra top headspace above `Translation` is removed by the shared header padding
- EPUB `Contents` adopts the shared section-title treatment

**Step 2: Run tests**

Run:

- `bun test src/components/TranslationPane.test.tsx`
- `bun test src/components/reader/ChatPanel.test.tsx`

Expected: PASS

### Task 4: Migrate dialogs, settings, and home onto the same type roles

**Files:**
- Modify: `src/views/HomeView.tsx`
- Modify: `src/components/settings/SettingsDialogContent.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/ConfirmationDialog.tsx`
- Modify: `src/App.css`
- Test: `src/views/HomeView.test.tsx`
- Test: `src/components/settings/SettingsDialogContent.test.tsx`

**Step 1: Write minimal implementation**

Replace one-off typography classes where the system now has a better semantic role:

- dialog title and description
- settings toolbar titles and form labels
- section-style headings like `Recent`
- home supporting text that should use body or meta roles

Keep existing layout and behavior intact. Only change the class structure and the CSS those classes point to.

**Step 2: Run tests**

Run:

- `bun test src/views/HomeView.test.tsx`
- `bun test src/components/settings/SettingsDialogContent.test.tsx`

Expected: PASS

### Task 5: Do full verification and tighten any regressions

**Files:**
- Modify only if needed after verification: `src/App.css`, `src/components/TranslationPane.tsx`, `src/components/reader/ChatPanel.tsx`, `src/views/HomeView.tsx`, `src/components/settings/SettingsDialogContent.tsx`, `src/App.tsx`, `src/components/ConfirmationDialog.tsx`, `src/components/document/EpubNavigationSidebar.tsx`

**Step 1: Run automated verification**

Run:

- `bun test src/components/TranslationPane.test.tsx`
- `bun test src/components/reader/ChatPanel.test.tsx`
- `bun test src/views/HomeView.test.tsx`
- `bun test src/components/settings/SettingsDialogContent.test.tsx`
- `bun run build`

Expected: PASS

**Step 2: Fix real regressions only**

Adjust only the styles or class usage needed to satisfy the failing output.

**Step 3: Re-run verification**

Run the same commands again and confirm they pass.
