# Readany Reader MVP Design

Status: Approved on 2026-04-18

## Summary

This MVP turns the current app from a manual "translate selected blocks" tool into a PDF-first bilingual reader.

The desired reading experience is:

- Open a PDF.
- See one original page on the left.
- See one readable translated page on the right.
- Change pages and keep both sides in sync.
- Translate automatically for the current page and prefetch the next page.
- Reuse cached translations when the user reopens the document.

EPUB support stays in the codebase, but it is not part of this redesign. OCR inside the app is explicitly out of scope for MVP.

## Product Goal

Make foreign-language PDFs readable enough for normal reading, without asking the user to manually select text paragraph by paragraph.

This is not meant to be a careful scholarly, legal, or publication-grade translation product. The translation is for comprehension and reading flow. Accuracy will depend on the selected model, provider, source text quality, and OCR quality when OCR text already exists inside the PDF.

## MVP Boundaries

### In scope

- PDF-first reading experience
- One-page reading view
- Automatic page translation
- Current page + next page prefetch
- Local translation caching
- Hidden but selectable text layer for text-based and OCR-text PDFs
- Selection pop-up translation for words, phrases, or sentences on the left page
- Multi-provider-ready translation settings
- OpenRouter support
- OpenAI-compatible custom endpoint support
- Model list fetching when supported, with manual model entry fallback

### Out of scope

- Built-in OCR for image-only PDFs
- Precise source-to-translation hover linking
- Structured translation alignment output
- EPUB redesign
- Perfect formatting preservation on the translation side
- Translating the whole book up front

## Reader Experience

### Main layout

- Left pane: original PDF page only
- Right pane: translated reading text for the same page

Both panes are controlled by one shared `currentPage` state. The user should never feel like the left and right sides are drifting apart.

### Page model

The MVP is page-based, not continuous-scroll-based.

That means:

- The reader focuses on one current page at a time.
- The PDF side should feel like a real page.
- The translation side should show the translation for that same page only.
- Page turn controls and keyboard shortcuts should move both sides together.

Continuous scrolling is not the main reading mode for this MVP because it makes page ownership ambiguous and complicates translation timing and token use.

### Translation behavior

When the user lands on page `N`:

1. Check local cache for page `N`.
2. If cached, show it immediately with no fake typing animation.
3. If not cached, show a lightweight loading state, then reveal the translation with a simple typewriter effect.
4. In the background, queue page `N + 1` for prefetch.

The translation unit is the page, not individual paragraphs. The right side is meant to be readable and calm, not a block-by-block inspection surface.

## Translation Quality Strategy

### Page-level translation with light context

The displayed translation is page-level, but the request should include a small amount of neighboring context:

- tail text from page `N - 1`
- main text from page `N`
- lead text from page `N + 1`

The prompt should tell the model clearly:

- use the neighboring text only as context
- output translation for page `N` only
- make the result readable
- ignore OCR noise when possible and make the best sense of damaged text

This is a pragmatic compromise. It helps when a sentence or phrase spills over a page break, especially in Asian languages, without paying to translate the entire document at once.

### Prompting stance

The translation prompt should optimize for readability, not literal scholarly fidelity.

Prompt goals:

- preserve meaning by and large
- prefer natural reading flow
- tolerate OCR noise
- avoid commentary or extra explanation
- output plain reading text only

## Left Pane Behavior

### Keep the original page visually clean

The current app renders a visible semi-transparent text layer on top of the PDF image. This makes the left pane look ghosted and double-printed.

For MVP:

- the user should see the original page as-is
- the text layer may still exist for selection, but it should not be visually visible
- selection should still work for text-based PDFs and OCR-text PDFs

In plain terms: the app should use the text layer as invisible selection infrastructure, not as something the user sees.

### Selection translation helper

The selection interaction stays, but as a helper, not the main reading flow.

Behavior:

- the right pane continues to show the full-page translation
- if the user selects a word, phrase, or sentence on the left page, show a small pop-up near the selection
- automatically translate the selection in that pop-up

This gives the user a quick "what does this exact line mean?" tool without breaking the full-page reading experience.

## Scanned PDF Handling

There are three practical cases:

1. Text-based PDF: usable text layer exists
2. OCR-text PDF: image page plus usable OCR text layer exists
3. Image-only scanned PDF: no usable text layer exists

MVP behavior:

- Cases 1 and 2 work
- Case 3 does not get translated inside the app yet

If a page or document has no usable text, the app should show a clear, friendly fallback such as:

`This PDF does not contain usable text yet. Please OCR it first, then reopen it in Readany.`

OCR inside the app is a future phase.

## Data Flow

### Keep paragraph/block extraction under the hood

Even though the display translation is page-level, the app should keep the existing extracted paragraph or block data structure in memory.

Reason:

- it already helps define page text
- it preserves source rectangles for future hover-linking work
- it allows later evolution toward structured translation alignment

So the MVP changes the translation/display unit, not the entire extraction model.

### New page translation state

Each page should gain page-level translation state, for example:

- `idle`
- `loading`
- `done`
- `error`
- `unavailable`

And page-level fields such as:

- source text summary
- translated display text
- whether the translation came from cache
- whether the page has usable source text

## Caching

### Cache goal

If a user closes a book and reopens it later, already translated pages should appear from cache instead of spending tokens again.

### Cache key

The page cache key should include:

- document ID
- page number
- source text hash
- provider ID
- model
- target language code
- prompt version

This preserves the benefits of cache reuse while correctly invalidating stale translations when the source text, model, provider, or prompt logic changes.

### Existing cache migration

The current cache is paragraph-oriented. MVP should add page-oriented caching for the reading flow. Old paragraph cache entries can stay in place temporarily if needed; the new reader flow should not depend on them.

## Provider Architecture

### MVP provider shape

The reader should not know whether the backend is using OpenRouter or some other provider. The frontend should call a generic translation layer.

MVP supports:

- `OpenRouter`
- `OpenAI-compatible endpoint`

The custom endpoint setup should support:

- provider display name
- base URL
- API key
- model

### Model selection

When the provider supports model listing:

- fetch the model list
- let the user choose from it

When model listing fails or is unsupported:

- allow manual model entry

This keeps the app friendly while still supporting custom or local setups.

### DeepSeek, MiniMax, Zhipu

These should not block MVP. The provider layer should be designed so they can be added cleanly next. If their APIs are compatible enough, the generic endpoint path can already cover some of those setups before dedicated presets are added.

## Settings UX

The translation settings should be simplified around the reader use case.

Core controls:

- provider
- API credentials / endpoint settings
- model
- target language

The old ideas of chunk mode, translation window radius, and manual paragraph translation are not a good fit for the new reading-first experience and should be removed or hidden from the primary settings flow.

## Reader UI States

### Normal states

- cached page translation: show immediately
- fresh page translation: show loading state, then typewriter reveal
- prefetched next page: page turn feels instant

### Error states

- no usable text: show OCR-needed message
- provider/API failure: show a retry action for the page
- model list fetch failure: fall back to manual model entry

### Disclaimer placement

Do not repeat translation warnings on every reading page.

Instead, place one unobtrusive disclaimer on the home screen or inside a help/about surface. It should explain that translation quality depends on the chosen provider/model and the quality of the original or OCR text.

## EPUB

Current EPUB support should stay in the codebase and should not be removed during this work.

However, EPUB is intentionally outside this MVP redesign. We will revisit EPUB later with its own product decisions.

## Developer Workflow

The current Tauri config already points `tauri dev` at the Vite development server:

- `beforeDevCommand`: `bun run dev`
- `devUrl`: `http://localhost:1420`

That means the normal development loop should already be:

- use `bun run tauri dev` for full app development
- get Vite hot reload for frontend changes
- accept Rust rebuilds only when backend code changes

For this MVP, that is enough. A separate browser-only mock shell can be considered later if frontend-only iteration still feels too slow.

## Future Phases

### OCR phase

Later, the text source should be abstracted so the reader can consume:

- native PDF text layer
- OCR-derived text layer
- possibly externally preprocessed OCR text

### Structured alignment phase

The future hover-linking feature will likely need structured prompts and structured outputs, such as JSON input and JSON output, so the app can map translated segments back to the original source blocks more reliably.

That work is explicitly deferred. MVP only preserves the underlying block/rect data so that future phase remains possible.
