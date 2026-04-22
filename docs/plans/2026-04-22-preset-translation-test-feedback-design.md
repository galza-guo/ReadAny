# Preset Translation Test Feedback Design

## Summary

Change the Settings preset test from a generic `Reply with OK` connectivity check to a tiny real translation request. Successful tests should still show the green check. Failed tests should show a yellow warning icon, surface a toast immediately, and preserve the provider's concrete error detail for hover inspection.

## Goals

- Make preset testing exercise the same chat-completions path used for translation.
- Use a very short translation prompt so the test is cheap and fast.
- Keep the row-level success state users already understand.
- Add an equally visible failure state in the preset list.
- Preserve specific backend/provider errors instead of flattening them into vague copy.

## Non-Goals

- No new standalone diagnostics screen.
- No expansion beyond the Settings preset test flow.
- No change to the main sentence/page translation prompts.

## Approach

### Backend test request

Reuse the short selection-translation system prompt shape and translate one tiny sample sentence into the app's current default target language. The backend should continue returning a structured preset test result, but add an optional `detail` field so the frontend can keep the raw provider error while still showing friendlier summary text.

### Error handling

The frontend should map raw provider failures to plain-English summaries for the main label and toast headline, but retain the original backend/provider message as diagnostic detail. That detail should be used in the warning tooltip and in the toast body when available.

### Settings UI

Keep the green success check in the preset row. When a test fails, show a yellow warning icon in the same title area. Hovering the warning should reveal a tooltip containing the friendly summary plus the preserved detailed error text. The expanded editor can continue showing an inline failure summary beneath the action row.

### Toasts

Upgrade the toast payload to support an optional detail line. A failed single-preset test should immediately show an error toast. `Test all` should also show a visible failure toast when one or more tests fail or when the batch request itself errors out.

## Testing Strategy

- Add or update frontend tests for the warning status affordance and preserved error detail behavior.
- Add or update provider error mapping tests for detail preservation.
- Run focused `bun test` coverage for the touched UI and error helpers.
- Run `cargo test` for the touched Rust backend logic.
