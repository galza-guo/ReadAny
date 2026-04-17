# Readany Reader MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a PDF-first bilingual reader mode that automatically translates the current page plus the next page, keeps the original page and translated page in sync, hides the visible PDF text layer while preserving text selection, and introduces a multi-provider translation foundation with model discovery fallback.

**Architecture:** Keep pdf.js paragraph/block extraction in place, but move the reader-facing translation unit from paragraph-level to page-level. Use a single shared `currentPage` state to drive both panes, add page-level caching in Rust, and expose generic translation/provider commands so the React app no longer depends on OpenRouter-specific command names.

**Tech Stack:** Tauri 2, Rust, React 19, TypeScript, Bun, pdf.js, Radix UI

---

### Task 1: Add page text helper coverage

**Files:**
- Create: `src/lib/pageText.ts`
- Create: `src/lib/pageText.test.ts`
- Modify: `src/types.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, test } from "bun:test";
import { buildPageTranslationPayload, hasUsablePageText } from "./pageText";

describe("pageText", () => {
  test("builds display text and neighbor context from page paragraphs", () => {
    const pages = [
      { page: 1, paragraphs: [{ pid: "a", page: 1, source: "Prev tail", status: "idle", rects: [] }] },
      { page: 2, paragraphs: [{ pid: "b", page: 2, source: "Main body", status: "idle", rects: [] }] },
      { page: 3, paragraphs: [{ pid: "c", page: 3, source: "Next lead", status: "idle", rects: [] }] },
    ];

    expect(buildPageTranslationPayload(pages, 2)).toEqual({
      page: 2,
      displayText: "Main body",
      previousContext: "Prev tail",
      nextContext: "Next lead",
    });
  });

  test("treats punctuation-only OCR noise as unusable page text", () => {
    expect(hasUsablePageText("...   ---")).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/pageText.test.ts`

Expected: FAIL because `src/lib/pageText.ts` does not exist yet.

**Step 3: Write minimal implementation**

```ts
import type { PageDoc } from "../types";

function joinParagraphs(page?: PageDoc): string {
  return (page?.paragraphs ?? []).map((item) => item.source.trim()).filter(Boolean).join("\n\n");
}

export function buildPageTranslationPayload(pages: PageDoc[], pageNumber: number) {
  const page = pages.find((item) => item.page === pageNumber);
  return {
    page: pageNumber,
    displayText: joinParagraphs(page),
    previousContext: joinParagraphs(pages.find((item) => item.page === pageNumber - 1)),
    nextContext: joinParagraphs(pages.find((item) => item.page === pageNumber + 1)),
  };
}

export function hasUsablePageText(text: string) {
  const cleaned = text.replace(/[\p{P}\p{S}\s]+/gu, "");
  return cleaned.length >= 8;
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/pageText.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/pageText.ts src/lib/pageText.test.ts src/types.ts
git commit -m "test: add page text helpers"
```

### Task 2: Add page queue helper coverage

**Files:**
- Create: `src/lib/pageQueue.ts`
- Create: `src/lib/pageQueue.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, test } from "bun:test";
import { getPagesToTranslate } from "./pageQueue";

describe("pageQueue", () => {
  test("returns current page and next page within bounds", () => {
    expect(getPagesToTranslate(5, 8)).toEqual([5, 6]);
  });

  test("does not overflow past the last page", () => {
    expect(getPagesToTranslate(8, 8)).toEqual([8]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/pageQueue.test.ts`

Expected: FAIL because `src/lib/pageQueue.ts` does not exist yet.

**Step 3: Write minimal implementation**

```ts
export function getPagesToTranslate(currentPage: number, totalPages: number) {
  const pages = [currentPage];
  if (currentPage + 1 <= totalPages) pages.push(currentPage + 1);
  return pages;
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/pageQueue.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/pageQueue.ts src/lib/pageQueue.test.ts
git commit -m "test: add page translation queue helper"
```

### Task 3: Add typewriter helper coverage

**Files:**
- Create: `src/lib/typewriter.ts`
- Create: `src/lib/typewriter.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, test } from "bun:test";
import { getNextRevealText } from "./typewriter";

describe("typewriter", () => {
  test("reveals text in bounded increments", () => {
    expect(getNextRevealText("", "abcdef", 2)).toBe("ab");
    expect(getNextRevealText("ab", "abcdef", 2)).toBe("abcd");
  });

  test("never reveals beyond the full text", () => {
    expect(getNextRevealText("abcd", "abc", 5)).toBe("abc");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/typewriter.test.ts`

Expected: FAIL because `src/lib/typewriter.ts` does not exist yet.

**Step 3: Write minimal implementation**

```ts
export function getNextRevealText(current: string, full: string, step: number) {
  return full.slice(0, Math.min(full.length, current.length + step));
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/typewriter.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/typewriter.ts src/lib/typewriter.test.ts
git commit -m "test: add typewriter reveal helper"
```

### Task 4: Add Rust provider and page cache helpers

**Files:**
- Create: `src-tauri/src/providers.rs`
- Create: `src-tauri/src/page_cache.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Write the failing test**

Add Rust unit tests inside `src-tauri/src/providers.rs` and `src-tauri/src/page_cache.rs`:

```rust
#[test]
fn openrouter_uses_fixed_models_endpoint() {
    let provider = ProviderConfig::openrouter_for_test("key");
    assert_eq!(provider.models_url().unwrap(), "https://openrouter.ai/api/v1/models");
}

#[test]
fn page_cache_key_changes_when_provider_or_prompt_version_changes() {
    let a = page_cache_key("doc", 12, "hash", "openrouter", "m1", "zh-CN", "v1");
    let b = page_cache_key("doc", 12, "hash", "custom", "m1", "zh-CN", "v1");
    let c = page_cache_key("doc", 12, "hash", "openrouter", "m1", "zh-CN", "v2");
    assert_ne!(a, b);
    assert_ne!(a, c);
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Expected: FAIL because the new modules and helpers do not exist yet.

**Step 3: Write minimal implementation**

Implement:

- `ProviderKind` with `OpenRouter` and `OpenAiCompatible`
- local provider settings storage in the app config directory
- `page_cache_key(...)`
- generic request helpers for translation and model listing
- Tauri commands:
  - `get_translation_providers`
  - `save_translation_providers`
  - `list_provider_models`
  - `translate_page_text`
  - `translate_selection_text`

Minimal Rust sketch:

```rust
pub fn page_cache_key(
    doc_id: &str,
    page: u32,
    source_hash: &str,
    provider_id: &str,
    model: &str,
    language: &str,
    prompt_version: &str,
) -> String {
    format!("{doc_id}|{page}|{source_hash}|{provider_id}|{model}|{language}|{prompt_version}")
}
```

**Step 4: Run test to verify it passes**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Expected: PASS

**Step 5: Commit**

```bash
git add src-tauri/src/providers.rs src-tauri/src/page_cache.rs src-tauri/src/lib.rs
git commit -m "feat: add provider abstraction and page cache helpers"
```

### Task 5: Refactor app state around page translations

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/types.ts`
- Modify: `src/lib/pageText.ts`
- Modify: `src/lib/pageQueue.ts`

**Step 1: Write the failing test**

Add one focused state test:

```ts
import { describe, expect, test } from "bun:test";
import { getPagesToTranslate } from "./pageQueue";

describe("page translation orchestration", () => {
  test("prefetches current page and next page only", () => {
    expect(getPagesToTranslate(2, 4)).toEqual([2, 3]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/pageQueue.test.ts`

Expected: FAIL if the queue helper does not yet match the new page-based orchestration rules.

**Step 3: Write minimal implementation**

In `src/App.tsx`:

- replace paragraph-triggered auto flow with page-triggered auto flow
- maintain `pageTranslations` keyed by page number
- on `currentPage` change, build the page payload and call `translate_page_text`
- queue `currentPage + 1` in the background
- skip requests for cached or already-loading pages
- stop using `mode`, `radius`, and `chunkSize` in the main reader flow

Add types like:

```ts
export type PageTranslationState = {
  page: number;
  displayText: string;
  translatedText?: string;
  status: "idle" | "loading" | "done" | "error" | "unavailable";
  isCached?: boolean;
};
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/pageQueue.test.ts src/lib/pageText.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/App.tsx src/types.ts src/lib/pageText.ts src/lib/pageQueue.ts
git commit -m "feat: switch reader state to page-level translation"
```

### Task 6: Replace continuous PDF reading with a synced single-page reader

**Files:**
- Modify: `src/components/PdfViewer.tsx`
- Modify: `src/components/PdfPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`

**Step 1: Write the failing test**

Add a tiny navigation helper test:

```ts
import { describe, expect, test } from "bun:test";
import { clampPage } from "./pageQueue";

describe("page navigation", () => {
  test("clamps requested page inside the document bounds", () => {
    expect(clampPage(0, 10)).toBe(1);
    expect(clampPage(11, 10)).toBe(10);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/pageQueue.test.ts`

Expected: FAIL because `clampPage` does not exist yet.

**Step 3: Write minimal implementation**

Update the reader shell so that:

- `PdfViewer` renders only the current page instead of a `Virtuoso` list
- the pane itself can scroll if zoom makes the page larger than the viewport
- toolbar page info stays accurate
- add previous/next page controls
- add keyboard page-turn support (`ArrowLeft`, `ArrowRight`, optionally `PageUp`, `PageDown`)

Minimal helper:

```ts
export function clampPage(page: number, totalPages: number) {
  return Math.min(totalPages, Math.max(1, page));
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/pageQueue.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/PdfViewer.tsx src/components/PdfPage.tsx src/App.tsx src/App.css src/lib/pageQueue.ts
git commit -m "feat: add single-page synchronized PDF reader"
```

### Task 7: Redesign the right pane for page translation and typewriter reveal

**Files:**
- Modify: `src/components/TranslationPane.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `src/lib/typewriter.ts`

**Step 1: Write the failing test**

Extend the typewriter test:

```ts
test("returns the full string unchanged for cached pages", () => {
  expect(getNextRevealText("cached", "cached", 4)).toBe("cached");
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/typewriter.test.ts`

Expected: FAIL until the helper cleanly handles already-complete text.

**Step 3: Write minimal implementation**

Refactor `TranslationPane.tsx` so it:

- shows a single translated page, not a scroll of paragraph blocks
- renders loading, unavailable, error, and done states
- uses the typewriter helper for fresh translations only
- skips the typewriter effect for cached translations
- keeps the old paragraph/block data out of the main display

Suggested component split:

- `TranslationPane.tsx` as the container
- optional new file `src/components/reader/PageTranslationView.tsx` for the page body

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/typewriter.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/TranslationPane.tsx src/App.tsx src/App.css src/lib/typewriter.ts
git commit -m "feat: show one translated page with typewriter reveal"
```

### Task 8: Hide the visible text layer and add selection pop-up translation

**Files:**
- Modify: `src/components/PdfPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`

**Step 1: Write the failing test**

Add a focused helper test for selection normalization in a new file if needed:

```ts
import { describe, expect, test } from "bun:test";
import { normalizeSelectionText } from "./pageText";

describe("selection text", () => {
  test("collapses whitespace before translation", () => {
    expect(normalizeSelectionText("foo \n  bar")).toBe("foo bar");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/pageText.test.ts`

Expected: FAIL because `normalizeSelectionText` does not exist yet.

**Step 3: Write minimal implementation**

Implement:

- visually invisible text layer (`opacity: 0`, keep `user-select: text`)
- selection detection on the left page
- small popover anchored near the selection
- call `translate_selection_text` for the selected snippet
- show the translated snippet in the popover

Do not restore the old visibly ghosted text layer.

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/pageText.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/PdfPage.tsx src/App.tsx src/App.css src/lib/pageText.ts src/lib/pageText.test.ts
git commit -m "feat: add invisible text selection popover translation"
```

### Task 9: Add provider settings UI, disclaimer placement, and manual QA docs

**Files:**
- Modify: `src/views/HomeView.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `README.md`
- Modify: `src-tauri/tauri.conf.json` only if branding text changes are intentionally included now

**Step 1: Write the failing test**

Add one validation helper test if you introduce provider form validation in TypeScript:

```ts
import { describe, expect, test } from "bun:test";
import { canListModels } from "./providerForm";

describe("provider form", () => {
  test("only lists models when a provider has enough connection info", () => {
    expect(canListModels({ kind: "openai-compatible", baseUrl: "", apiKey: "x" })).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/providerForm.test.ts`

Expected: FAIL until the helper exists.

**Step 3: Write minimal implementation**

Update the home/settings UX so it:

- shows a provider selector
- supports OpenRouter and OpenAI-compatible endpoint configuration
- provides a "Fetch models" action when supported
- keeps manual model input as fallback
- removes reader-facing controls that no longer matter (`mode`, `radius`, `chunkSize`)
- adds one unobtrusive disclaimer on the home screen or a help/about area
- updates README usage text to match the new page-based reader flow

Leave EPUB support present; do not remove the EPUB code path.

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/providerForm.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/views/HomeView.tsx src/App.tsx src/App.css README.md src/lib/providerForm.ts src/lib/providerForm.test.ts
git commit -m "feat: add provider settings and home disclaimer"
```

### Task 10: Full verification pass

**Files:**
- No new source files required

**Step 1: Run frontend tests**

Run: `bun test`

Expected: PASS

**Step 2: Run TypeScript build**

Run: `bun run build`

Expected: PASS

**Step 3: Run Rust tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Expected: PASS

**Step 4: Run manual reader QA**

Run: `bun run tauri dev`

Manually verify:

- opening a text-based PDF shows one page on the left and one translated page on the right
- changing pages keeps both sides synchronized
- page `N + 1` feels prefetched after reading page `N`
- cached pages return immediately on reopen
- the left page no longer looks ghosted
- selecting text on the left opens a translation pop-up
- image-only PDFs show the OCR-needed message
- provider settings can fetch models when supported and still allow manual entry when not
- EPUB still opens through its existing flow

**Step 5: Commit**

```bash
git add .
git commit -m "chore: verify readany reader mvp"
```
