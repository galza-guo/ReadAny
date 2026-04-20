# Dark Theme Backdrop Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Darken the app backdrop in dark mode without changing panel surfaces.

**Architecture:** Introduce a dedicated `--app-backdrop` theme token so the window-level background can diverge from `--bg`, which is already used by smaller UI surfaces. Wire only the top-level shells to the new token so the darker backdrop shows through behind the reader and home layouts while panel colors remain intact.

**Tech Stack:** React 19, TypeScript, Bun tests, app-wide CSS in `src/App.css`

---

### Task 1: Dedicated Backdrop Token

**Files:**
- Modify: `src/App.css`
- Create: `src/AppTheme.test.tsx`
- Create: `docs/plans/2026-04-20-dark-theme-backdrop-design.md`
- Create: `docs/plans/2026-04-20-dark-theme-backdrop.md`

**Step 1: Write the failing test**

Add a CSS regression test that checks:

- `:root` defines `--app-backdrop`
- `[data-theme="dark"]` defines a darker `--app-backdrop`
- the top-level window shells use `background: var(--app-backdrop)`

**Step 2: Run test to verify it fails**

Run: `bun test src/AppTheme.test.tsx`

Expected: FAIL because the dedicated backdrop token and shell usage do not exist yet.

**Step 3: Write minimal implementation**

- Add `--app-backdrop` to the light and dark theme tokens in `src/App.css`
- keep `--panel` and related surface tokens unchanged
- update `body`, `.app-shell`, and `.home` to use `var(--app-backdrop)`

**Step 4: Run test to verify it passes**

Run: `bun test src/AppTheme.test.tsx`

Expected: PASS

**Step 5: Run broader verification**

Run: `bun test src/AppTheme.test.tsx src/components/reader/PanelToggleGroup.test.tsx src/components/PdfViewer.test.tsx`

Expected: PASS

**Step 6: Run build verification**

Run: `bun run build`

Expected: PASS
