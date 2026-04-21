# Shared Translation Cache Implementation Plan

> **For Codex:** No dedicated writing-plans skill is available in this workspace, so implement this plan directly in order and keep the write scope tight.

**Goal:** Decouple translation cache from provider presets so existing translations remain visible and counted after a provider switch, while explicit redo actions still overwrite shared cached results with the current provider's output.

**Architecture:** Move both PDF page cache and sentence cache to content-based shared keys. Keep provider and model as metadata only. Add a focused backend read path for cached PDF page bodies, and add a force-fresh translation path for EPUB retry and retranslate flows. Update the React reader so shared cached results hydrate back into visible page state and shared progress survives preset switching.

**Tech Stack:** React 19, TypeScript, Bun tests, Tauri, Rust

---

### Task 1: Refactor backend cache keys to be provider-independent

**Files:**
- Modify: `src-tauri/src/page_cache.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Write the failing test**

Add Rust tests that verify:

- page cache keys remain stable when provider or model changes
- sentence cache keys remain stable when provider or model changes
- page cache listing and clearing operate by document and language scope instead of preset scope

**Step 2: Run test to verify it fails**

Run: `cargo test page_cache`

Expected: FAIL because the current cache key still includes preset and model scope.

**Step 3: Write minimal implementation**

Update page cache key generation and sentence cache key generation so they use:

- content identity
- document identity
- target language
- prompt version

Keep provider and model in saved metadata only.

**Step 4: Run test to verify it passes**

Run: `cargo test page_cache`

Expected: PASS

### Task 2: Add backend support for cached PDF body hydration

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify if needed: `src/types.ts`

**Step 1: Add the failing behavior target**

Define a narrow Tauri command that can return the cached translation body for one PDF page lookup using:

- `docId`
- `page`
- `displayText`
- `targetLanguage`

**Step 2: Write minimal implementation**

Add a command that:

- rebuilds the shared page cache key from the current page payload
- returns the cached translation body if it exists
- returns a miss cleanly when it does not

Do not add a broad document preload API.

**Step 3: Verify behavior**

Run: `cargo test page_cache`

Expected: PASS

### Task 3: Add force-fresh sentence translation for EPUB redo flows

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify if needed: `src/types.ts`

**Step 1: Write the failing behavior target**

Define how EPUB retry and retranslate requests mark specific sentence ids as force-fresh so old shared cache hits are bypassed.

**Step 2: Write minimal implementation**

Extend the backend sentence translation command so it can:

- skip cache lookup for selected ids or for the whole request
- overwrite the shared cache with the new result

Keep the default path cache-friendly for normal translation.

**Step 3: Verify behavior**

Run: `cargo test`

Expected: PASS for the focused backend suite touched by this change.

### Task 4: Preserve shared progress across preset switches in the PDF reader

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/lib/pageTranslationScheduler.ts`
- Modify: `src/lib/pageTranslationScheduler.test.ts`

**Step 1: Write the failing test**

Add coverage that verifies:

- cached PDF pages still count as translated after the active preset changes
- shared progress no longer drops to zero merely because the preset changes

**Step 2: Write minimal implementation**

Adjust the PDF reader state reset behavior so preset switching:

- invalidates in-flight work tied to the old session
- keeps shared cache-driven progress logic intact
- does not treat preset changes as document cache deletion

**Step 3: Run test to verify it passes**

Run: `bun test src/lib/pageTranslationScheduler.test.ts`

Expected: PASS

### Task 5: Rehydrate cached PDF translation bodies into the current page state

**Files:**
- Modify: `src/App.tsx`
- Modify if needed: `src/components/TranslationPane.tsx`
- Modify or create test: `src/components/TranslationPane.test.tsx`

**Step 1: Write the failing behavior target**

Cover the case where:

- the current page is already cached
- the provider preset changes
- the translation pane should still show the cached body

**Step 2: Write minimal implementation**

Add a lightweight hydration flow that loads cached text for the active PDF page when:

- the page is current
- the page is known to be cached
- the in-memory translation body is missing or stale

Make the pane render the restored text immediately as a cached translation.

**Step 3: Run test to verify it passes**

Run: `bun test src/components/TranslationPane.test.tsx`

Expected: PASS

### Task 6: Make EPUB retry and retranslate truly overwrite shared cache

**Files:**
- Modify: `src/App.tsx`
- Modify tests near EPUB translation behavior if needed

**Step 1: Add the failing behavior target**

Define and cover:

- single-paragraph retry with force-fresh behavior
- EPUB `Retranslate All` replacing existing shared translations

**Step 2: Write minimal implementation**

Thread the force-fresh option from the EPUB retry and bulk retranslate flows into the backend translation command.

Keep ordinary EPUB translation unchanged for the common case.

**Step 3: Verify behavior**

Run: `bun run build`

Expected: PASS

### Task 7: Run focused verification and fix regressions

**Files:**
- Modify only if needed after verification: `src/App.tsx`, `src/lib/pageTranslationScheduler.ts`, `src/components/TranslationPane.tsx`, `src-tauri/src/lib.rs`, `src-tauri/src/page_cache.rs`, related tests

**Step 1: Run automated verification**

Run:

- `bun test src/lib/pageTranslationScheduler.test.ts`
- `bun test src/components/TranslationPane.test.tsx`
- `cargo test page_cache`
- `bun run build`

**Step 2: Fix any real regressions**

Adjust only the code needed by failing output.

**Step 3: Re-run verification**

Run the same commands again and confirm they pass.
