# Updater And Toast System Design

## Summary

This change adds built-in self-update support to `readani` using Tauri's updater plugin, backed by GitHub Releases, and introduces a small app-wide toast system for lightweight status messages. The updater should stay quiet during normal reading: it checks on launch, downloads updates in the background, and only surfaces an install action once the update is fully ready.

## Goals

- Add Tauri self-update support for desktop releases.
- Keep update discovery and downloading silent by default.
- Show a ready-to-install `Update` control only after the download completes.
- Add a reusable toast system for updater messages and future app-wide notices.
- Keep a manual safety path in the `About` dialog with `Check for update` and `Open latest release`.

## Non-Goals

- No forced or automatic install/restart.
- No blocking modal during update checks or downloads.
- No expansion of the update surface beyond the existing home header, reader header, and About dialog.

## Approach

### Updater runtime

Use Tauri's official updater plugin plus the process plugin for relaunch after install. The app will start a background check after launch. If an update is found, it will begin downloading immediately. The updater state should be tracked in `App.tsx` so both the home view and reader header can react consistently.

### Update entry points

The main `Update` button stays hidden until the update is fully downloaded. Once ready, it appears just to the left of the theme toggle in both the home and reader views. The button should reuse the existing expanding icon-button pattern, but gain a subtle blue circular accent behind the download icon so it reads as actionable without becoming loud.

The `About` dialog should always expose:

- `Check for update` as the primary manual updater action
- `Open latest release` as a secondary fallback button at the bottom

### Toast system

Add a small toast provider and viewport at the app shell level so any feature can publish lightweight status messages without building one-off alert UI. The updater will use it first for these messages:

- `Found an update. Downloading now.`
- `You're running the latest version.`
- `Update failed: ...`
- `Update is already downloading.`
- `Update is ready to install.`

### Release pipeline

Keep the existing GitHub Releases workflow, but extend it to publish Tauri updater artifacts alongside the current DMG/MSI installers. The release job should attach the signed updater archives, signatures, and a `latest.json` manifest so the app can self-update against GitHub Releases.

## Testing Strategy

- Add focused component/source tests for the new update controls and About dialog actions.
- Run frontend tests covering touched components.
- Run the production frontend build and a Tauri build check if feasible.
- Validate the release workflow changes for correct artifact discovery and manifest generation.
