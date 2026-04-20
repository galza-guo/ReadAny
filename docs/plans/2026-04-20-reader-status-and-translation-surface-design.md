# Reader Status And Translation Surface Design

Status: Approved on 2026-04-20

## Goal

Separate document status from translation status so each message appears next to the UI it describes, while giving the original pane the responsibility for document loading and document-open failures.

## Product Decision

The reader should stop using the bottom status bar as a mixed message area.

Instead, the reader UI gets three clear status surfaces:

- the top toolbar for general document messages
- the translation pane header for translation-related messages
- the translation pane footer for translation progress and bulk translation actions

This structure applies to both PDF and EPUB.

## User Experience

### Original Pane

The original pane shows document-level messages such as:

- loading the current document
- failing to open the current file

These messages belong in the original pane because they describe the state of the document surface itself, not the global reader chrome.

When there is no original content ready yet, the message should replace the empty placeholder state for that pane.

Examples:

- `Loading document`
- `Failed to load PDF. The file may have been moved or deleted.`
- `Failed to load EPUB. The file may have been moved or deleted.`

### Original-Pane Overlay

`Extracting text` is different from the fully blocking document messages.

For PDF, the page itself can already render once the document is open. Text extraction happens afterward so translation and highlight mapping can work. Because the original page is already visible, the app should keep showing the document and add a small in-pane overlay strip at the bottom of the original pane.

This strip should:

- sit in the same visual row as the zoom dock
- use the same overlay feel as the zoom control
- show the extraction message and progress without covering the page completely

### Translation Pane Header

The translation pane header shows only translation-related status such as:

- translating the current page or section
- redoing the current page or section
- translating the whole document in the background
- resetting translation cache
- translation errors, including missing API key or backend failures

This keeps translation feedback inside the translation workspace instead of detached at the bottom of the window.

### Translation Pane Footer

The translation pane footer becomes the shared home for bulk translation progress and actions.

It should show:

- a progress label such as `3/12 pages translated` or `2/9 sections translated`
- a completion state such as `Fully translated`
- a bulk action button that reads `Translate All` until the document is complete, then changes to `Retranslate All`

The footer remains visible for both PDF and EPUB.

## Translation Units

The UI should feel the same regardless of file format. The difference is only what the app treats as one bulk translation unit.

- PDF uses pages
- EPUB uses sections or chapters

EPUB should continue using its current virtual pages for reading and scrolling. Bulk progress and bulk translation should instead be grouped by EPUB section identity so the app speaks in the natural unit of an ebook.

The EPUB section identity should be derived from the existing extracted metadata:

- primary grouping key: `epubHref`
- preferred label: `sectionTitle`
- fallback label: `Section N`

## Architecture

`src/App.tsx` remains the source of truth for reader-level state, but the existing single `statusMessage` should be split into two explicit state tracks:

- `documentStatusMessage`
- `translationStatusMessage`

`documentStatusMessage` feeds the original pane.

`translationStatusMessage` feeds the translation pane header.

The current page and paragraph translation logic should stay in place, but bulk translation progress needs one shared abstraction that can express either:

- page progress for PDFs
- section progress for EPUBs

The helper can stay lightweight. It does not need a large new domain model, only enough structure to count translatable units, determine whether the document is fully translated, and resolve the correct bulk action label.

## EPUB Bulk Translation

EPUB already translates paragraph by paragraph. That pipeline should be reused rather than replaced.

Bulk EPUB translation should:

- group paragraphs by section
- count completion by section
- queue untranslated or retryable paragraphs section by section
- mark a section complete only when all translatable paragraphs in that section are complete

This keeps the current paragraph-level translation behavior while letting the user reason about bulk progress in chapter-like terms.

## Layout Refactor Scope

The refactor should:

- remove the bottom reader status bar entirely
- move the current toolbar `Translate All` action into the translation pane footer
- move the current translation progress indicator into the translation pane footer
- keep the translation pane body focused on current translation content

The refactor should not:

- change the PDF or EPUB reading layout
- move translation work out of the Rust backend
- add new product features outside the new status and bulk-action placement

## Error Handling

Document failures should stay in the original pane because they prevent the document surface from becoming usable.

Translation failures should stay in the translation pane because they affect translation work specifically.

Examples:

- `Failed to load PDF...` stays in the original pane
- `Failed to reset page translation cache...` moves to the translation pane header
- missing API key errors move to the translation pane header

The current page or section content area should keep its own inline error state where it already exists, such as retry controls for page or paragraph translation.

## Testing Expectations

Automated and manual verification should cover:

- blocking document loading and load-failure messages appearing in the original pane
- `Extracting text` appearing as a non-blocking overlay in the PDF original pane
- translation messages appearing in the translation pane header
- footer progress and bulk action placement for both PDF and EPUB
- `Translate All` switching to `Retranslate All` only when fully translated
- EPUB progress being counted by section rather than virtual page
- removal of the bottom reader status bar without losing important feedback
