import { describe, expect, test } from "bun:test";
import appCss from "../App.css?raw";
import aboutPanelSource from "./settings/AboutSettingsPanel.tsx?raw";
import releaseSource from "../lib/release.ts?raw";

describe("AboutSettingsPanel", () => {
  test("uses the home banner artwork at a smaller tab-friendly size", () => {
    expect(aboutPanelSource).not.toContain('import appIcon');
    expect(aboutPanelSource).not.toContain('about-dialog-app-icon');
    expect(aboutPanelSource).toContain("readani-banner-light-theme.png");
    expect(aboutPanelSource).toContain("readani-banner-dark-theme.png");
    expect(aboutPanelSource).toContain('className="about-settings-banner"');
    expect(appCss).toContain("width: min(100%, 224px)");
    expect(appCss).toContain("align-items: center");
    expect(aboutPanelSource).not.toContain('t("about.description")');
  });

  test("uses settings-style rows instead of the old centered dialog spacing", () => {
    const panelRule = appCss.match(/\.about-settings-panel\s*\{([^}]*)\}/)?.[1] ?? "";
    const rowRule = appCss.match(/\.about-settings-row\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(aboutPanelSource).not.toContain("<dt");
    expect(aboutPanelSource).not.toContain("<dd");
    expect(aboutPanelSource).not.toContain("about-dialog-metadata");

    expect(panelRule).toContain("max-width: 620px");
    expect(panelRule).toContain("--about-settings-label-width: 128px");
    expect(panelRule).not.toContain("margin: 0 auto");
    expect(rowRule).toContain("grid-template-columns: var(--about-settings-label-width)");
    expect(appCss).toContain("grid-template-columns: var(--about-settings-label-width) minmax(0, 1fr)");
  });

  test("thanks Everett explicitly for the upstream PDFRead project and includes Phosphor Icons", () => {
    expect(releaseSource).toContain("Everett");
    expect(releaseSource).toContain("PDFRead");
    expect(releaseSource).toContain("https://github.com/everettjf");
    expect(releaseSource).toContain("https://github.com/everettjf/PDFRead");
    expect(releaseSource).toContain("Phosphor Icons");
    expect(releaseSource).toContain("https://phosphoricons.com");
    expect(aboutPanelSource).toContain("READANI_UPSTREAM_AUTHOR_URL");
    expect(aboutPanelSource).toContain("READANI_UPSTREAM_REPO_URL");
    expect(aboutPanelSource).toContain("READANI_PHOSPHOR_URL");
    expect(aboutPanelSource).toContain("Special Thanks");
    expect(appCss).not.toContain("padding-left: calc(var(--about-settings-label-width) + 16px)");
  });

  test("adds a changelog reader link beside the version and replaces the old contact row with a mail icon beside the author", () => {
    expect(aboutPanelSource).toContain('t("about.changelog")');
    expect(aboutPanelSource).toContain("setChangelogOpen(true)");
    expect(aboutPanelSource).toContain("about-settings-icon-link");
    expect(aboutPanelSource).toContain("mailto:");
    expect(aboutPanelSource).toContain("EnvelopeSimple");
    expect(aboutPanelSource).not.toContain("Contact");
    expect(aboutPanelSource).not.toContain("Created by");
    expect(aboutPanelSource).not.toContain("Built ");
    expect(aboutPanelSource).toContain("ChangelogDialog");
  });

  test("offers update actions in the footer with a built-in check and manual release fallback", () => {
    const actionsRule = appCss.match(/\.about-settings-actions\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(aboutPanelSource).toContain("onCheckForUpdates");
    expect(aboutPanelSource).toContain("onOpenLatestRelease");
    expect(aboutPanelSource).toContain('className="about-settings-actions"');
    expect(aboutPanelSource).toContain('className="btn btn-quiet-action about-settings-action"');
    expect(aboutPanelSource).not.toContain("about-settings-action-primary");
    expect(aboutPanelSource).not.toContain(">Updates<");
    expect(aboutPanelSource).toContain('t("about.checkForUpdate")');
    expect(aboutPanelSource).toContain('t("about.openLatestRelease")');
    expect(releaseSource).toContain("READANI_RELEASES_URL");
    expect(actionsRule).toContain("justify-content: center");
    expect(actionsRule).toContain("margin-top: auto");
    expect(appCss).not.toContain("width: var(--about-settings-label-width)");
  });

  test("hides update actions entirely when app updates are disabled", () => {
    expect(aboutPanelSource).toContain("updateActionsEnabled");
    expect(aboutPanelSource).toContain("updateActionsEnabled && updateStatusMessage");
    expect(aboutPanelSource).toContain("updateActionsEnabled ? (");
    expect(aboutPanelSource).toContain('className="about-settings-actions"');
  });

  test("loads the version from the runtime app metadata with a fallback", () => {
    expect(releaseSource).toContain("getReadaniRuntimeVersion");
    expect(releaseSource).toContain('return await getTauriAppVersion()');
    expect(releaseSource).toContain("return READANI_VERSION");
    expect(aboutPanelSource).toContain("const [appVersion, setAppVersion] = useState(READANI_VERSION);");
    expect(aboutPanelSource).toContain("void getReadaniRuntimeVersion().then");
    expect(aboutPanelSource).toContain('t("about.version", { appVersion })');
    expect(aboutPanelSource).toContain("Build {READANI_BUILD_TIMESTAMP_LABEL}");
    expect(aboutPanelSource).not.toContain("Build date");
    expect(aboutPanelSource).not.toContain("about-settings-label");
    expect(appCss).toContain(".about-settings-meta");
    expect(releaseSource).not.toContain('second: "2-digit"');
  });

  test("styles the changelog as a wider scrollable reader instead of dumping raw markdown", () => {
    expect(appCss).toContain(".dialog-content-changelog");
    expect(appCss).toContain(".changelog-dialog-body");
    expect(appCss).toContain(".changelog-section-list");
    expect(appCss).toContain(".changelog-inline-code");
  });
});
