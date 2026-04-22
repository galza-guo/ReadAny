# Ollama Provider Design

## Summary

Add `ollama` as a first-class translation provider. It should use Ollama's OpenAI-compatible endpoints, default to the local `/v1` base URL, and never require or show an API key. Shared translation cache behavior stays exactly as it is today.

## Goals

- Let users add an Ollama preset without entering a fake API key.
- Keep the existing backend request flow and prompt shapes.
- Reuse the same model-listing and chat-completions paths already used for OpenAI-compatible providers.
- Preserve the current provider-independent cache keys.

## Non-Goals

- No cache-key changes.
- No new translation pipeline or Ollama-specific prompt format.
- No new authentication flow.

## Approach

### Backend

Add `ProviderKind::Ollama` beside the existing provider kinds. Treat it like the current OpenAI-compatible path for URL construction, but skip API key validation and omit the `Authorization` header when no key exists. Default its base URL to `http://localhost:11434/v1`.

### Settings UI

Expose `Ollama` in the provider picker. Show an editable Base URL field for Ollama presets, prefilled with the local default. Hide the API key field entirely for Ollama and make validation/model loading depend on Base URL plus model only.

### Persistence

If a saved preset is switched from a key-based provider to Ollama, do not carry the old API key forward. Ollama presets should save without credentials.

## Testing Strategy

- Update frontend helper tests for provider labels, defaults, validation, and model-loading rules.
- Update settings UI tests to confirm Ollama hides the API key input and still shows Base URL.
- Update Rust tests for provider validation and provider-kind serialization.
