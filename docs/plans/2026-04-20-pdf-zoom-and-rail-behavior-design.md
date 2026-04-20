# PDF Zoom And Rail Behavior Design

Status: Approved on 2026-04-20

## Goal

Make the PDF zoom control feel like one coherent tool, and prevent the PDF from getting stranded off-screen when the right rail becomes visible.

## Product Decision

The compact zoom pill and the expanded zoom controls should be two states of the same control, not two separate visible layers.

When the user opens the zoom control, the compact pill should expand in place and become the full zoom control.

The reader should also protect the user from a trapped custom zoom state when the right rail appears. If the rail was hidden and becomes visible while reading a PDF, the PDF should snap back to `fit-width`.

## User Experience

### Zoom Control

The bottom-right zoom UI should behave like a single anchored control:

- closed state: one compact zoom pill
- open state: one expanded zoom surface in the same anchored position

The compact pill should not remain visible underneath or beside the expanded controls.

### Rail Reveal

When translation or chat makes the right rail appear for a PDF:

- if the original pane is visible, the PDF should return to `fit-width`
- this should happen once on the transition from “no rail” to “rail visible”
- it should not keep reapplying on later drag resizes

This prevents the page from being clipped off-screen when the pane becomes narrower.

## Architecture

`src/components/PdfViewer.tsx` should own the zoom dock presentation and render only one zoom state at a time.

`src/lib/readerWorkspace.ts` should expose a small helper for detecting when the right rail becomes visible so `src/App.tsx` can apply the PDF zoom policy in one place.

`src/App.tsx` remains the source of truth for PDF zoom mode. It should switch to `fit-width` only when:

- the current file is a PDF
- the original pane is visible
- the right rail has just become visible
- the current PDF zoom mode is not already `fit-width`

## Testing Expectations

Automated verification should cover:

- the zoom dock rendering a compact closed state
- the zoom dock rendering an expanded state without the compact trigger still present
- detection of the “rail became visible” transition
- switching a PDF back to `fit-width` on that transition
