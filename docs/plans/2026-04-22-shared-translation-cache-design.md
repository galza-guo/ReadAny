# Shared Translation Cache Design

Status: Approved on 2026-04-22

## Goal

Make translation cache independent from the active provider preset so a reader can translate part of a book with one provider, switch to another provider, and continue from the same translated progress without losing visible translations or progress counts.

## Product Decision

The app should treat cached translations as document content, not as provider-specific session state.

In practical terms:

- a translated PDF page remains translated after the user switches provider presets
- an EPUB paragraph translation remains translated after the user switches provider presets
- progress counts should reflect whether a page or paragraph already has a usable cached translation, regardless of which provider created it
- switching providers should affect only future translation requests

When the user explicitly chooses to redo or retranslate, the app should use the currently active provider and overwrite the shared cached result for the affected scope.

## User Experience

### Provider Switching

If the user translates pages 1-10 with provider preset A, then switches to provider preset B:

- pages 1-10 still appear translated
- the PDF progress label still counts those pages as translated
- `Translate All` continues with untranslated pages instead of starting over

The same rule applies to EPUB paragraph and section progress.

### Current Page Behavior

For PDFs, the translation pane should not rely on a page-number-only cache marker.

If the shared cache already contains the current page translation:

- the app should restore the translated text into the current page state
- the right pane should render the restored text immediately
- the page may show as cached, but it must also show the actual translation text

This avoids the current broken state where progress says a page is translated but the translation pane is empty.

### Redo And Retranslate

Shared cache does not mean immutable cache.

When the user requests:

- `Redo page`
- `Retranslate All`
- EPUB retry or retranslate behavior

the app should bypass the existing shared cache entry for that scope and replace it with a new result from the currently active provider preset.

In plain language:

- provider switching should preserve old work
- explicit redo actions should replace old work

## Cache Model

### Matching Rules

Translation cache lookup should match on content identity plus target language, not on provider identity.

#### PDF Page Cache Key

The page cache key should use:

- `docId`
- `page`
- `sourceHash`
- `targetLanguage.code`
- `promptVersion`

It should not include:

- `presetId`
- `providerKind`
- `providerId`
- `model`

#### Sentence Cache Key

The sentence cache key used by EPUB paragraph translation should use:

- `docId`
- `sid`
- `sourceHash`
- `targetLanguage.code`
- prompt version if needed for compatibility

It should not include:

- `presetId`
- provider identity
- `model`

### Stored Metadata

Cache entries should still remember where a translation came from, but only as metadata.

Useful metadata includes:

- active preset id at the time of translation
- provider kind or label
- model
- cached timestamp

This metadata may be shown in future UI or used for debugging, but it must not decide whether an existing translation is reusable.

## Reader Behavior

### Shared Progress

PDF progress should count a page as translated when either:

- the page translation state is currently loaded and done
- the shared cache contains a matching translation for that page

EPUB progress should count a paragraph or section as translated based on the shared sentence cache-backed paragraph state, not based on the active provider.

### Hydration Of Cached Results

For PDF pages, listing cached pages is not enough.

The app needs one of these behaviors:

1. eagerly hydrate current-page cached text into `pageTranslations`
2. lazily fetch and load cached text when a page becomes active

The preferred behavior is lightweight lazy hydration:

- keep the cached page list for progress and bulk skipping
- when the current page becomes active and has a shared cached hit, load the cached translation body into page state if it is not already present

This keeps the UI responsive without forcing the app to materialize the whole book into memory.

### Bulk Translation

`Translate All` should operate on untranslated content only.

For PDFs:

- shared cached pages are skipped
- newly translated pages use the currently active provider preset

For EPUBs:

- already translated paragraphs are skipped
- untranslated paragraphs use the currently active provider preset

The user should be able to switch providers halfway through a book and keep moving forward naturally.

## Redo Semantics

### PDF

`Redo page` should:

- clear the shared cache entry for that page
- request a fresh translation with the active provider preset
- overwrite the shared cache entry with the new result

`Retranslate All` should:

- clear the shared cache entries for the current document and language
- request fresh translations with the active provider preset
- rebuild progress from the new results

### EPUB

The current EPUB retry path reuses the sentence cache path directly, so it must gain an explicit fresh-translation mode.

When the user retries a paragraph or retranslates all sections:

- the request should bypass or clear the shared sentence cache for the affected paragraph ids
- the backend should save the newly returned translations back into the same shared cache

Without this rule, a retry would silently reload the old cached text and appear broken.

## Backend Responsibilities

The Rust backend should own the cache format and cache lookup behavior.

It should be responsible for:

- removing provider identity from page and sentence cache keys
- preserving provider and model as non-matching metadata
- exposing a way to read cached PDF translation text for the active page
- exposing a way to force fresh translation for EPUB retry and retranslate flows
- continuing to save cache files under the same app config location

The backend should not delete existing cache files just because the format changes. It should continue to tolerate older entries where possible.

## Frontend Responsibilities

The React app should:

- stop clearing meaningful translation state just because the active preset changed
- continue clearing or invalidating only the parts that are truly provider-sensitive, such as in-flight request sessions
- restore cached PDF translation text into the current page state after provider switches
- keep the progress label based on shared cache availability
- ensure redo flows intentionally bypass cache instead of being trapped by old hits

The UI should not expose provider-specific cache partitions because that would add workflow complexity that the MVP does not need.

## Migration And Compatibility

Older cache entries may still contain provider-specific keys.

The new implementation does not need a one-time migration that rewrites the whole file immediately. It can:

- keep reading the existing file
- write new entries using the shared key format
- gradually let new shared entries replace old provider-scoped entries when the user revisits content

If lightweight cleanup becomes necessary later, it can be added as a separate maintenance task rather than part of this fix.

## Error Handling

If the app can determine that a page is cached but cannot load the cached body, it should behave as untranslated and queue a fresh translation instead of leaving the pane blank forever.

If a cache read fails entirely, the app should:

- log the failure
- avoid reporting fake translated progress
- allow the user to continue translating from the active provider

This keeps the failure mode obvious and recoverable.

## Testing Expectations

Automated coverage should verify:

- PDF cache keys no longer change when the provider or preset changes
- sentence cache keys no longer change when the provider or preset changes
- switching presets does not zero out translated PDF progress for already cached pages
- the current PDF page rehydrates cached text after a preset switch
- `Translate All` skips shared cached pages and continues with untranslated pages
- EPUB retry and retranslate flows can force a fresh result instead of reusing old cache

Manual verification should cover:

- translate several PDF pages with preset A, switch to preset B, and confirm progress remains
- revisit a previously translated PDF page after switching presets and confirm the body still appears
- continue translating forward with preset B and confirm only remaining pages are requested
- translate EPUB content with preset A, switch to preset B, and confirm already translated paragraphs remain
- retry an EPUB paragraph after switching presets and confirm the new provider result replaces the old one
