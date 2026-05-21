# TODO

## Exact path to App Store release

1. Lock the release lane.
   Treat the first official commercial launch as Mac App Store only: subscriptions, managed `readani` AI gateway, and App Store-compliant packaging. Keep GitHub Releases available as a free BYOK-only direct-download lane whenever needed.
2. Make the proprietary AI gateway usable from `readani`.
   Add a trusted `readani` backend layer inside PersonalSite. The consumer Mac app uses StoreKit 2 subscription proof; the trusted backend verifies entitlement server-side before calling the shared PersonalSite AI gateway.
3. Choose the desktop gateway trust model.
   Decision: do not expose the shared AI gateway directly to the desktop app. Use StoreKit 2 JWS verification through PersonalSite `/api/readani/*` routes, then call the existing gateway with a server-side token. The key rule is that the desktop app must not embed upstream provider secrets or gateway server tokens.
4. Configure the gateway for `readani`.
   Add `readani`-specific app policy, allowed model aliases, rate limits, environment variables, production storage, and usage monitoring.
5. Define paid entitlement rules.
   Keep BYOK free. Make `readani`'s proprietary AI gateway and premium accent colors subscription features. Leave exact usage caps and paywall thresholds for a later product pass.
6. Implement Apple subscriptions.
   Add Mac App Store auto-renewable subscription products in App Store Connect, wire StoreKit into the Tauri app, support purchase / restore / subscription status, and prepare sandbox/TestFlight billing tests.
7. Connect subscription status to gateway access.
   The PersonalSite `readani` backend must verify an active StoreKit 2 subscription before allowing proprietary AI usage.
8. Add in-app product changes.
   Add provider selection that clearly separates BYOK from `readani` gateway usage, add subscription entry points and paywall UI, gate premium accent colors, and explain the difference between free BYOK and paid managed AI.
9. Finish Mac App Store build compliance.
   Disable the in-app updater for App Store builds, keep build-channel gating in Rust and frontend code, prepare privacy disclosures, and write reviewer notes explaining document text transmission and AI usage.
10. Run release verification.
   Test PDF flows, thoroughly test EPUB flows, verify purchase/restore/cancel/expired subscription behavior, verify paid/free gating, and do a full App Store submission dry run before release.

## Release strategy

- Ship the first official commercial macOS release through the Mac App Store.
- Keep GitHub Releases available as a free BYOK-only lane. This lane can ship before, during, or after the App Store work, but it must not depend on subscriptions or the proprietary `readani` gateway.
- Split macOS release work into two lanes:
  - Mac App Store build with Apple-compliant packaging, StoreKit subscriptions, paid managed AI, premium accent colors, and no in-app updater
  - GitHub direct-download build with BYOK providers only, no subscription UI, no proprietary `readani` gateway access, and its own updater path
- Audit the current app against Mac App Store review requirements, especially sandboxing, file access, network use, privacy wording, and release packaging.

## Paid tier and billing

- Plan for a subscription paid tier, not a one-time unlock.
- Keep BYOK free.
- Offer access to `readani`'s own proprietary AI gateway as a paid feature.
- Offer additional accent color options as a paid feature.
- Decide the exact paywall limits later.
- Design the paid-tier architecture so the Mac App Store route comes first. Do not add direct-download billing unless a later product pass explicitly chooses that lane.
- Avoid forcing a full account system into scope unless it becomes clearly necessary for the paid gateway or future cross-platform entitlement syncing.
- Do not assume the current iOS-first AI gateway client contract can be reused unchanged for the macOS Tauri app.

## App Store implementation

- Remove or disable the in-app updater for Mac App Store builds.
- Keep the updater architecture isolated so a future `.dmg` build can still use it.
- Add App Store-specific build gating in frontend and Rust code so App Store-only restrictions are enforced by build channel, not by manual discipline.
- Add StoreKit subscription support for the Mac App Store build.
- Support purchase restore, subscription state refresh, and paid entitlement checks in the app.
- Prepare App Store submission notes that explain what document text is sent to translation providers and when.
- Prepare privacy disclosures for BYOK providers and the future proprietary AI gateway.

## Reader polish

- Reintroduce saved words as a proper reader-facing "word notebook" (`生词本`) feature, with a clearer workflow than the current hidden vocabulary prototype.
- Polish the EPUB experience.
- Test the EPUB experience properly end to end, since it has not been thoroughly tested yet.
- Add model selection for AI chat.

## Post-MVP annotation polish

- Highlight color customization UI (tokens already in place)
- PDF drag-to-snap annotation creation
- Richer annotation filtering or search in the overlay panel
- Broader original-document highlighting beyond sentence-linked surfaces
