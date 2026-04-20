# Dark Theme Backdrop Design

**Date:** 2026-04-20

**Goal:** Make the app backdrop feel a little darker in dark mode while leaving panel and card surfaces unchanged.

## Context

The current dark theme already switches the app into a dark palette, but the overall window backdrop still reads a bit too close to the interior surfaces. The requested change is specifically about the background behind the content, not the panels themselves.

## Approved Direction

Add a dedicated app-backdrop theme token and use it only for the full-window background layers:

- keep the existing panel tokens unchanged
- keep reader and home content surfaces unchanged
- darken only the app backdrop in dark mode
- keep the light theme backdrop visually the same

## Implementation Shape

- Add `--app-backdrop` to the shared theme tokens in `src/App.css`.
- Set a darker neutral gray value for `--app-backdrop` in `[data-theme="dark"]`.
- Point the top-level app backgrounds at `--app-backdrop` instead of `--bg`.
- Add a focused CSS regression test that proves the dedicated backdrop token exists and that the top-level shells use it.

## Verification

- Run the focused CSS test covering the backdrop token and shell usage.
- Run the production build to catch any regressions.
