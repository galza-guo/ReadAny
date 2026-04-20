# Reader Status And Translation Surface Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move document loading and document-open errors into the original pane, render PDF text extraction as an in-pane overlay near the zoom dock, keep translation-specific messages in the translation pane, and give both PDF and EPUB a shared translation-pane footer with progress plus `Translate All` or `Retranslate All`.

**Architecture:** Keep the reader shell state in `src/App.tsx`, split the current status string into explicit document and translation message tracks, and render document status inside the original pane instead of the header. Use a blocking pane state when the original content is unavailable and a lightweight bottom overlay when the PDF is already visible but text extraction is still running. Reuse the existing paragraph translation pipeline for EPUB instead of inventing a parallel backend path.

**Tech Stack:** React 19, TypeScript, Bun tests, Tauri, Rust, Radix UI, pdf.js, epub.js

---

### Task 1: Split reader status into document and translation channels

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/lib/readerStatus.ts`
- Test: `src/lib/readerStatus.test.ts`

**Step 1: Write the failing test**

Extend `src/lib/readerStatus.test.ts` so it verifies the display labels needed by the new split UI:

- document loading label resolves to `Loading document`
- text extraction label resolves to `Extracting text`
- page and section translation labels remain concise
- ready state still resolves cleanly

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/readerStatus.test.ts`

Expected: FAIL because the helper coverage does not match the new status split yet.

**Step 3: Write minimal implementation**

In `src/App.tsx`:

- replace `statusMessage` with `documentStatusMessage` and `translationStatusMessage`
- route load and extraction messages to `documentStatusMessage`
- route page, section, bulk translation, cache reset, and translation error messages to `translationStatusMessage`
- keep message normalization in one small place instead of parsing mixed status strings all over the component

In `src/lib/readerStatus.ts`:

- keep the compact label helper for loading, extracting, translating, redoing, and ready states
- add only the minimal helpers needed to support both toolbar and translation header labels

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/readerStatus.test.ts`

Expected: PASS

### Task 2: Add translation-scope progress helpers for PDF pages and EPUB sections

**Files:**
- Modify: `src/lib/pageTranslationScheduler.ts`
- Modify: `src/lib/pageTranslationScheduler.test.ts`
- Modify: `src/types.ts`

**Step 1: Write the failing test**

Add helper tests that verify:

- PDF progress still counts only translatable pages
- EPUB progress counts unique translatable sections rather than virtual pages
- a fully translated PDF resolves the bulk action label to `Retranslate All`
- a fully translated EPUB resolves the bulk action label to `Retranslate All`

Use small fixtures where:

- one EPUB section spans multiple virtual pages
- one section has only non-usable paragraphs and should not count toward the denominator

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/pageTranslationScheduler.test.ts`

Expected: FAIL because the helper currently only knows how to count PDF pages.

**Step 3: Write minimal implementation**

Refactor `src/lib/pageTranslationScheduler.ts` so it can:

- return progress summaries for PDF pages
- return progress summaries for EPUB sections using `epubHref` as the grouping key
- expose the correct unit label for footer copy, such as `pages` or `sections`
- resolve the bulk action label to `Translate All` or `Retranslate All`

In `src/types.ts`, add only the extra lightweight types needed for footer progress props if they improve readability.

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/pageTranslationScheduler.test.ts`

Expected: PASS

### Task 3: Move document status out of the header and into the original pane

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Create: `src/components/document/DocumentStatusSurface.tsx`
- Test: `src/components/document/DocumentStatusSurface.test.tsx`
- Modify: `src/components/PdfViewer.tsx`
- Modify: `src/components/PdfViewer.test.tsx`

**Step 1: Write the failing test**

Define the UI targets for:

- a blocking original-pane status surface for `Loading document` and document-open failures
- a bottom overlay status surface for `Extracting text`
- removal of document status from the header

Add focused component coverage that verifies:

- the blocking surface renders message plus optional progress
- the overlay surface renders as a compact dock strip
- `PdfViewer` places the extraction overlay inside the same shell layer as the zoom dock

Run: `bun test src/components/document/DocumentStatusSurface.test.tsx src/components/PdfViewer.test.tsx`

Expected: FAIL because the new status surface and PDF overlay props do not exist yet.

**Step 2: Write minimal implementation**

In `src/App.tsx`:

- stop rendering document status beside `Back to Library`
- render `Loading document` and document-open failures in the original pane when no original content is available yet
- keep the reader open on load failure so the original pane can show the failure state
- pass extraction overlay props into `PdfViewer`

In `src/components/document/DocumentStatusSurface.tsx`:

- render one shared status surface with `blocking` and `overlay` variants
- support optional progress for both variants

In `src/components/PdfViewer.tsx`:

- render the extraction overlay inside the viewer shell so it shares the overlay layer with the zoom dock

In `src/App.css`:

- add blocking original-pane status styling
- add the compact bottom overlay strip styling
- align the overlay row visually with the zoom dock

**Step 3: Verify behavior**

Run: `bun run build`

Expected: PASS

### Task 4: Add a shared translation-pane footer for bulk progress and actions

**Files:**
- Modify: `src/components/TranslationPane.tsx`
- Modify: `src/App.css`
- Modify: `src/App.tsx`

**Step 1: Add the failing behavior target**

Define the footer API so `TranslationPane` can receive:

- progress label
- fully translated indicator
- bulk action label
- bulk action callback
- disabled or running state

**Step 2: Write minimal implementation**

Add a footer to both PDF and EPUB translation panes that shows:

- `X/Y pages translated` or `X/Y sections translated`
- `Fully translated` when complete
- `Translate All` or `Retranslate All`

Move the existing PDF `Translate All` action out of the toolbar and into this footer.

Keep the footer layout stable so the progress text and button do not shift the pane unexpectedly.

**Step 3: Verify behavior**

Run: `bun run build`

Expected: PASS

### Task 5: Add EPUB bulk translate and retranslate behavior by section

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/TranslationPane.tsx`
- Modify: `src/lib/pageTranslationScheduler.ts`
- Modify only if needed: `src/components/document/EpubViewer.tsx`

**Step 1: Write the failing test**

Add focused helper coverage or small component-adjacent logic tests for:

- grouping EPUB paragraphs by section key
- deciding whether a section is complete only when all its translatable paragraphs are done
- resolving the next EPUB sections to process for `Translate All` and `Retranslate All`

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/pageTranslationScheduler.test.ts`

Expected: FAIL because EPUB bulk translation grouping does not exist yet.

**Step 3: Write minimal implementation**

In `src/App.tsx`:

- add an EPUB bulk translation action that reuses `handleTranslatePid` or the existing paragraph queueing path
- for `Translate All`, queue untranslated or errored paragraphs section by section
- for `Retranslate All`, reset existing paragraph translations for the affected sections back to `idle`, then queue them again
- update `translationStatusMessage` during EPUB bulk translation using section-aware wording

Do not change EPUB reading pagination. Keep section grouping limited to translation progress and bulk actions.

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/pageTranslationScheduler.test.ts`

Expected: PASS

### Task 6: Verify PDF behavior still works after the UI move

**Files:**
- Modify only if needed after verification: `src/App.tsx`, `src/components/TranslationPane.tsx`, `src/App.css`, `src/lib/pageTranslationScheduler.ts`, `src/lib/readerStatus.ts`

**Step 1: Run automated verification**

Run:

- `bun test src/lib/readerStatus.test.ts`
- `bun test src/lib/pageTranslationScheduler.test.ts`
- `bun test src/lib/pageText.test.ts`
- `bun test src/lib/pageQueue.test.ts`
- `bun run build`

Expected: PASS

**Step 2: Fix any real regressions**

Adjust only the code required by the failing output.

**Step 3: Re-run verification**

Run the same commands again and confirm they pass.

### Task 7: Do focused manual reader checks before closing the refactor

**Files:**
- No additional file changes unless manual verification reveals a real bug

**Step 1: Verify PDF reader flow**

Confirm manually that:

- loading a PDF shows document messages in the toolbar
- current-page translation messages show in the translation pane header
- the footer shows page progress and the bulk action button
- `Retranslate All` appears only when the PDF is fully translated

**Step 2: Verify EPUB reader flow**

Confirm manually that:

- loading an EPUB shows document messages in the toolbar
- paragraph and bulk translation messages show in the translation pane header
- the footer shows section-based progress and the bulk action button
- one section spanning multiple virtual pages still counts as one translated section

**Step 3: Commit**

Run:

```bash
git add src/App.tsx src/App.css src/components/TranslationPane.tsx src/lib/readerStatus.ts src/lib/readerStatus.test.ts src/lib/pageTranslationScheduler.ts src/lib/pageTranslationScheduler.test.ts src/types.ts docs/plans/2026-04-20-reader-status-and-translation-surface-design.md docs/plans/2026-04-20-reader-status-and-translation-surface.md
git commit -m "refactor: move reader status into toolbar and translation pane"
```
