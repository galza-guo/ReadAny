# StoreKit Gateway Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the first App Store-only managed AI path for `readani`, backed by StoreKit 2 subscription proof and PersonalSite server-side gateway access.

**Architecture:** `readani` keeps BYOK providers unchanged and adds a separate `readani-ai` provider kind for the managed gateway. The macOS app obtains Apple-signed StoreKit 2 transaction JWS proof, Rust sends it to PersonalSite `/api/readani/*`, PersonalSite verifies entitlement, then PersonalSite calls the existing shared AI gateway with its server-side token.

**Tech Stack:** Tauri 2, Rust, React, TypeScript, StoreKit 2, Swift, Next.js Route Handlers, Apple App Store Server Node Library, Bun tests, Cargo tests.

**Current App Store Connect values:** App Apple ID `6771291039`; bundle ID `com.xnu.readani`; StoreKit product ID `readani.polyglot.monthly`; App Store Connect subscription numeric ID `22104132`.

---

### Task 1: Add Managed Provider Shape Without Calling The Network

**Files:**
- Modify: `src/types.ts`
- Modify: `src/lib/appSettings.ts`
- Modify: `src/lib/providerForm.ts`
- Test: `src/lib/appSettings.test.ts`
- Test: `src/lib/providerForm.test.ts`
- Modify: `src-tauri/src/providers.rs`
- Modify: `src-tauri/src/app_settings.rs`

**Step 1: Write the failing frontend tests**

Add tests that expect:

- `readani-ai` is a valid `TranslationProviderKind`.
- `createPresetDraft("readani-ai")` uses model alias `general-fast`.
- `providerUsesApiKey("readani-ai")` is false.
- `providerUsesEditableBaseUrl("readani-ai")` is false.
- `canListModels({ kind: "readani-ai" })` is true because aliases come from PersonalSite, not from a user API key.

**Step 2: Run frontend tests to verify they fail**

Run:

```bash
bun test src/lib/appSettings.test.ts src/lib/providerForm.test.ts
```

Expected: FAIL because `readani-ai` is not recognized.

**Step 3: Add minimal frontend provider support**

Update the provider kind union, option list, labels, default model map, normalization aliases, and form helpers. Do not add subscription UI in this task.

**Step 4: Write Rust unit tests**

Add Rust tests in the existing `src-tauri/src/app_settings.rs` test module that expect a `readani-ai` preset to normalize with no API key, no base URL, and model `general-fast`.

**Step 5: Run Rust tests to verify they fail**

Run:

```bash
cd src-tauri && cargo test readani_ai
```

Expected: FAIL because `ProviderKind::ReadaniAi` does not exist.

**Step 6: Add minimal Rust provider enum support**

Add `ProviderKind::ReadaniAi`, make `uses_api_key()` return false, prevent direct OpenAI-compatible URL resolution for this kind, and add app-setting normalization defaults.

**Step 7: Verify**

Run:

```bash
bun test src/lib/appSettings.test.ts src/lib/providerForm.test.ts
cd src-tauri && cargo test readani_ai
```

Expected: PASS.

---

### Task 2: Add StoreKit 2 Subscription Bridge

**Files:**
- Create: `src-tauri/src/storekit.rs`
- Modify: `src-tauri/src/lib.rs`
- Create: `src-tauri/macos/StoreKitBridge.swift`
- Modify: `src-tauri/build.rs`
- Test: `src-tauri/src/storekit.rs`

**Step 1: Write Rust tests around product configuration**

Test that product IDs are read from `READANI_STOREKIT_PRODUCT_IDS` and that the default state reports subscriptions unavailable on non-macOS builds.

**Step 2: Run the test to verify it fails**

Run:

```bash
cd src-tauri && cargo test storekit
```

Expected: FAIL because `storekit` module does not exist.

**Step 3: Add the Rust StoreKit module and Tauri commands**

Expose:

- `get_readani_subscription_status`
- `purchase_readani_subscription`
- `restore_readani_subscription`

The command response includes `isActive`, `productId`, `expiresAt`, and `transactionJws`.

**Step 4: Add macOS Swift bridge**

Implement StoreKit 2 calls in Swift:

- `Product.products(for:)`
- `product.purchase()`
- `AppStore.sync()`
- `Transaction.currentEntitlements`
- return verified `transaction.jwsRepresentation`

The Rust module calls Swift through a small C ABI. Non-macOS builds compile to an unavailable response.

**Step 5: Verify**

Run:

```bash
cd src-tauri && cargo test storekit
```

Expected: PASS.

---

### Task 3: Add PersonalSite StoreKit Verification Helpers

**Files in `/Users/guolite/GitHub/PersonalSite`:**
- Modify: `package.json`
- Create: `lib/readani-gateway/storekit.ts`
- Create: `lib/readani-gateway/config.ts`
- Test: `lib/readani-gateway/storekit.test.ts`

**Step 1: Add failing server tests**

Test that verification rejects missing JWS, wrong product ID, revoked transactions, expired subscriptions, and wrong bundle ID.

**Step 2: Run the tests to verify they fail**

Run from PersonalSite:

```bash
npm test -- --runInBand lib/readani-gateway/storekit.test.ts
```

If the repo has no test runner configured, use TypeScript typecheck plus a small Node script test and document the command in this plan before implementing.

**Step 3: Install Apple server library**

Add `@apple/app-store-server-library`.

**Step 4: Implement verification helper**

Use `SignedDataVerifier` to verify and decode transaction JWS. Read bundle ID, app Apple ID, environment, product IDs, and Apple root certificate paths from server-only environment variables.

**Step 5: Verify**

Run the chosen PersonalSite test command and `npm run build`.

Expected: PASS.

---

### Task 4: Add PersonalSite `/api/readani/*` Routes

**Files in `/Users/guolite/GitHub/PersonalSite`:**
- Create: `app/api/readani/models/route.ts`
- Create: `app/api/readani/chat/route.ts`
- Create: `lib/readani-gateway/client.ts`
- Test: route or helper tests beside the new helpers

**Step 1: Write failing tests**

Test that:

- Missing or invalid StoreKit proof returns `403`.
- Valid proof calls the shared `/api/ai/models` or `/api/ai/chat` path with server credentials.
- Chat requests forward `Idempotency-Key`.
- Only approved model aliases are accepted.

**Step 2: Implement routes**

The routes accept:

```json
{
  "subscriptionProof": { "transactionJws": "..." },
  "model": "general-fast",
  "messages": [{ "role": "user", "content": "..." }],
  "metadata": { "feature": "translation" }
}
```

They verify StoreKit first, then call the shared gateway server-side.

**Step 3: Verify**

Run PersonalSite tests and build:

```bash
npm run build
```

Expected: PASS.

---

### Task 5: Route Managed Translation Through PersonalSite

**Files:**
- Create: `src-tauri/src/readani_gateway.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/providers.rs`
- Test: Rust tests in `src-tauri/src/readani_gateway.rs`

**Step 1: Write failing Rust tests**

Test that managed requests:

- Require a StoreKit transaction JWS.
- Send model aliases, messages, metadata, and an idempotency key.
- Parse the gateway `outputText` field.
- Map `403`, `429`, and upstream errors into plain provider errors.

**Step 2: Implement the gateway client**

Add a Rust HTTP client for PersonalSite `/api/readani/chat`. It should be used only when `preset.provider_kind == ProviderKind::ReadaniAi`.

**Step 3: Preserve local cache behavior**

Keep the existing page and sentence caches. Include provider id and model alias in cache keys as the existing preset cache system already does.

**Step 4: Verify**

Run:

```bash
cd src-tauri && cargo test readani_gateway
```

Expected: PASS.

---

### Task 6: Add Minimal App Store UI Entry Points

**Files:**
- Modify: `src/components/settings/SettingsDialogContent.tsx`
- Modify: `src/components/settings/providerIcons.tsx`
- Modify: `src/App.tsx`
- Test: `src/components/settings/SettingsDialogContent.test.tsx`

**Step 1: Write failing UI tests**

Test that the managed provider option is visible only when `READANI_MANAGED_GATEWAY_ENABLED` is true, and that it does not show API key or base URL fields.

**Step 2: Implement UI**

Add the provider option, subscription status copy, purchase button, and restore button. Keep wording English-only.

**Step 3: Verify**

Run:

```bash
bun test src/components/settings/SettingsDialogContent.test.tsx
bun run build
```

Expected: PASS.

---

### Task 7: End-To-End Verification

**Files:**
- Modify docs if setup env vars or App Store product IDs are finalized.

**Step 1: Verify readani**

Run:

```bash
bun test
bun run build
cd src-tauri && cargo test
```

**Step 2: Verify PersonalSite**

Run:

```bash
cd /Users/guolite/GitHub/PersonalSite && npm run build
```

**Step 3: Manual App Store sandbox test**

Run an App Store-channel build with StoreKit testing configured, buy/restore the subscription, translate one page through `readani-ai`, and confirm BYOK providers still work.
