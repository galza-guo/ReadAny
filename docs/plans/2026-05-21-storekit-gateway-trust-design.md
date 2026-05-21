# StoreKit Gateway Trust Design

## Decision

`readani` will use StoreKit 2 subscription verification for the consumer Mac App Store release.

The managed AI path will be:

1. `readani` Mac App Store app
2. PersonalSite `/api/readani/*` trusted backend routes
3. PersonalSite shared AI gateway
4. upstream AI provider

GitHub free builds do not use this path. They remain BYOK-only.

## Why

The existing PersonalSite AI gateway has two useful modes:

- iOS App Attest session mode
- server-to-server token mode

The consumer macOS app should not call the shared gateway directly with a long-lived secret. Anything embedded in a desktop app can eventually be extracted. The app should also not rely on Managed Device Attestation for the first release because that is aimed at managed/enterprise device workflows, while `readani` is a consumer App Store app.

StoreKit 2 is the right first-release trust source because the paid feature is a subscription. The app can use StoreKit 2 for purchase, restore, current entitlement checks, and signed transaction data. The server can verify the StoreKit 2 JWS before allowing managed AI usage.

## App Responsibilities

- Fetch subscription products with StoreKit 2.
- Start purchase and restore flows.
- Read current entitlements with StoreKit 2.
- Send signed StoreKit 2 transaction proof to PersonalSite when requesting managed AI access.
- Keep BYOK provider flows separate from managed gateway flows.
- Hide managed gateway controls in GitHub free builds.

## PersonalSite Responsibilities

- Add `/api/readani/*` routes for `readani` subscription-backed gateway access.
- Verify StoreKit 2 JWS transaction proof server-side.
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

## Open Product Questions

- Product IDs for monthly and yearly subscriptions.
- Exact managed AI usage caps.
- Whether premium accent colors unlock from the same subscription or a later product rule.
- Whether account syncing is needed later. It is not part of the first release.

## References

- Apple StoreKit overview: https://developer.apple.com/storekit/
- StoreKit `Transaction`: https://developer.apple.com/documentation/storekit/transaction
- StoreKit `VerificationResult`: https://developer.apple.com/documentation/storekit/verificationresult
- App Store Server Library: https://developer.apple.com/documentation/appstoreserverapi/simplifying-your-implementation-by-using-the-app-store-server-library
