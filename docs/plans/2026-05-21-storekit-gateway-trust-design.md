# StoreKit Gateway Trust Design

## Decision

`readani` will use StoreKit 2 subscription verification for the consumer Mac App Store release.

The managed AI path will be:

1. `readani` Mac App Store app
2. PersonalSite `/api/readani/*` trusted backend routes
3. PersonalSite shared AI gateway
4. upstream AI provider

GitHub free builds do not use this path. They remain BYOK-only.

The first gateway integration slice includes StoreKit 2 from the start. Development-only entitlement bypasses are not part of the managed AI request path.

## Why

The existing PersonalSite AI gateway has two useful modes:

- iOS App Attest session mode
- server-to-server token mode

The consumer macOS app should not call the shared gateway directly with a long-lived secret. Anything embedded in a desktop app can eventually be extracted. The app should also not rely on Managed Device Attestation for the first release because that is aimed at managed/enterprise device workflows, while `readani` is a consumer App Store app.

StoreKit 2 is the right first-release trust source because the paid feature is a subscription. The app can use StoreKit 2 for purchase, restore, current entitlement checks, and signed transaction data. The server can verify the StoreKit 2 JWS before allowing managed AI usage.

## App Responsibilities

- Fetch subscription products with StoreKit 2.
- Start purchase and restore flows.
- Read current entitlements with StoreKit 2. Apple documents `Transaction.currentEntitlements` as the active entitlement source for non-consumables and subscriptions that are subscribed or in grace period.
- Send signed StoreKit 2 transaction proof to PersonalSite when requesting managed AI access.
- Keep BYOK provider flows separate from managed gateway flows.
- Hide managed gateway controls in GitHub free builds.
- Send only Apple-signed JWS proof to PersonalSite. The app must not send a self-declared "subscribed" flag as authorization.

## PersonalSite Responsibilities

- Add `/api/readani/*` routes for `readani` subscription-backed gateway access.
- Verify StoreKit 2 JWS transaction proof server-side. Apple recommends verifying the `Transaction` `jwsRepresentation` on a server when the server needs the strongest control.
- Confirm the product ID belongs to the `readani` subscription group.
- Confirm entitlement is active and not revoked or expired.
- Apply `readani`-specific usage limits.
- Call the existing PersonalSite AI gateway using the gateway's server-to-server token mode.
- Keep gateway server tokens and upstream provider API keys in server-side environment variables only.

## Shared Gateway Responsibilities

- Add a `readani` server app policy.
- Restrict allowed model aliases for `readani`.
- Enforce gateway-level rate limits.
- Log usage by `readani` app policy, model alias, provider, and request outcome.

## Error Handling

- Missing or inactive subscription: show a paywall or restore-purchase path.
- Invalid StoreKit proof: show a subscription verification failure and avoid retry loops.
- Gateway rate limit: explain that managed AI is temporarily limited.
- Upstream provider failure: reuse the existing provider error language where possible.
- BYOK failures must stay separate from subscription failures.

## App Store Connect Values

- App Apple ID: `6771291039`
- Bundle ID: `com.xnu.readani`
- StoreKit product ID / reference name: `readani.polyglot.monthly`
- App Store Connect subscription numeric ID: `22104132`

The app and server use the product ID string. The numeric subscription ID is for App Store Connect/admin reference, not StoreKit lookup.

## Open Product Questions

- Exact managed AI usage caps.
- Whether premium accent colors unlock from the same subscription or a later product rule.
- Whether account syncing is needed later. It is not part of the first release.

## First Implementation Slice

1. Add a `readani-ai` provider kind and model alias handling without changing existing BYOK behavior.
2. Add a macOS StoreKit 2 bridge that can load subscription products, purchase, restore, and return the current verified transaction JWS for configured `readani` product IDs.
3. Add Rust Tauri commands that expose subscription status and purchase/restore actions to the frontend.
4. Add PersonalSite `/api/readani/models` and `/api/readani/chat` routes. These routes accept StoreKit JWS proof, verify it, then call the existing shared AI gateway through server-to-server auth.
5. Route managed translation through `/api/readani/chat` while preserving the existing local translation caches and fallback behavior.

## References

- Apple StoreKit overview: https://developer.apple.com/storekit/
- StoreKit `Transaction`: https://developer.apple.com/documentation/storekit/transaction
- StoreKit `Transaction.currentEntitlements`: https://developer.apple.com/documentation/storekit/transaction/currententitlements
- StoreKit `VerificationResult`: https://developer.apple.com/documentation/storekit/verificationresult
- StoreKit `VerificationResult.jwsRepresentation`: https://developer.apple.com/documentation/storekit/verificationresult/jwsrepresentation-21vgo
- Apple receipt and transaction validation: https://developer.apple.com/documentation/storekit/validating-receipts-with-the-app-store
- App Store Server Library: https://developer.apple.com/documentation/appstoreserverapi/simplifying-your-implementation-by-using-the-app-store-server-library
