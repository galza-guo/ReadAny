# PDF Zoom And Rail Behavior Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the PDF zoom control expand in place and automatically return PDFs to fit-width when the right rail first appears.

**Architecture:** Keep zoom mode state in `src/App.tsx`, but move the “did the rail just become visible?” decision into a small helper in `src/lib/readerWorkspace.ts`. In `src/components/PdfViewer.tsx`, render the zoom dock as a single anchored control with mutually exclusive closed and expanded states.

**Tech Stack:** React 19, TypeScript, Bun tests, Tauri, pdf.js

---

### Task 1: Detect when the right rail becomes visible

**Files:**
- Modify: `src/lib/readerWorkspace.ts`
- Test: `src/lib/readerWorkspace.test.ts`

**Step 1: Write the failing test**

Add tests that verify:

- transitioning from no translation/chat to either translation or chat returns `true`
- transitions where the rail was already visible return `false`
- transitions where the original pane is hidden still do not affect the helper itself

**Step 2: Run test to verify it fails**

Run: `~/.bun/bin/bun test src/lib/readerWorkspace.test.ts`

Expected: FAIL because the helper does not exist yet.

**Step 3: Write minimal implementation**

Add a small helper to `src/lib/readerWorkspace.ts` that compares previous and next panel state and returns whether the shared right rail has just become visible.

**Step 4: Run test to verify it passes**

Run: `~/.bun/bin/bun test src/lib/readerWorkspace.test.ts`

Expected: PASS

### Task 2: Render the zoom dock as one control with two states

**Files:**
- Modify: `src/components/PdfViewer.tsx`
- Modify: `src/components/PdfViewer.test.tsx`
- Modify: `src/App.css`

**Step 1: Write the failing test**

Add focused zoom dock coverage that verifies:

- closed state renders the compact zoom trigger
- open state renders the expanded controls
- open state does not still render the compact trigger as a second visible control

**Step 2: Run test to verify it fails**

Run: `~/.bun/bin/bun test src/components/PdfViewer.test.tsx`

Expected: FAIL because the current zoom dock renders the trigger and expanded panel together.

**Step 3: Write minimal implementation**

Update `src/components/PdfViewer.tsx` and `src/App.css` so the zoom dock renders either:

- the compact trigger, or
- the expanded control

in the same anchored position.

**Step 4: Run test to verify it passes**

Run: `~/.bun/bin/bun test src/components/PdfViewer.test.tsx`

Expected: PASS

### Task 3: Auto-fit PDF when the rail first appears

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/lib/readerWorkspace.ts`
- Test: `src/lib/readerWorkspace.test.ts`

**Step 1: Add the failing behavior target**

Define the transition policy:

- only PDFs
- only when original pane is visible
- only when the rail becomes visible
- only when current zoom mode is not already `fit-width`

**Step 2: Write minimal implementation**

In `src/App.tsx`, track the previous `readerPanels` state and switch the PDF zoom mode to `fit-width` when the helper says the rail has just appeared.

Do not change EPUB zoom behavior.

**Step 3: Verify behavior**

Run: `~/.bun/bin/bun test src/lib/readerWorkspace.test.ts src/components/PdfViewer.test.tsx`

Expected: PASS

### Task 4: Run verification

**Files:**
- Modify only if needed after verification: `src/App.tsx`, `src/components/PdfViewer.tsx`, `src/App.css`, `src/lib/readerWorkspace.ts`

**Step 1: Run focused verification**

Run:

- `~/.bun/bin/bun test src/lib/readerWorkspace.test.ts`
- `~/.bun/bin/bun test src/components/PdfViewer.test.tsx`

Expected: PASS

**Step 2: Run build**

Run: `~/.bun/bin/bun run build`

Expected: PASS
