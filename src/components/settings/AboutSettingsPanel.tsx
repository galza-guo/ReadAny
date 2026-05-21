import { useEffect, useState } from "react";
import { ArrowSquareOut, ArrowsClockwise, EnvelopeSimple } from "@phosphor-icons/react";
import {
  READANI_AUTHOR_EMAIL,
  READANI_AUTHOR_NAME,
  READANI_BUILD_TIMESTAMP_LABEL,
  READANI_COPYRIGHT_LINE,
  READANI_PHOSPHOR_NAME,
  READANI_PHOSPHOR_URL,
  READANI_PRODUCT_NAME,
  READANI_RELEASES_URL,
  READANI_UPSTREAM_AUTHOR_NAME,
  READANI_UPSTREAM_AUTHOR_URL,
  READANI_UPSTREAM_REPO_NAME,
  READANI_UPSTREAM_REPO_URL,
  READANI_VERSION,
  getReadaniRuntimeVersion,
} from "../../lib/release";
import { t } from "../../lib/i18n";
import readaniBannerForDarkTheme from "../../assets/readani-banner-dark-theme.png";
import readaniBannerForLightTheme from "../../assets/readani-banner-light-theme.png";
import { ChangelogDialog } from "../ChangelogDialog";

type AboutSettingsPanelProps = {
  onCheckForUpdates: () => void;
  onOpenLatestRelease: () => void;
  updateActionsEnabled?: boolean;
  updateStatusMessage?: string | null;
};

export function AboutSettingsPanel({
  onCheckForUpdates,
  onOpenLatestRelease,
  updateActionsEnabled = true,
  updateStatusMessage,
}: AboutSettingsPanelProps) {
  const [appVersion, setAppVersion] = useState(READANI_VERSION);
  const [changelogOpen, setChangelogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getReadaniRuntimeVersion().then((version) => {
      if (!cancelled) {
        setAppVersion(version);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="about-settings-panel">
      <section className="about-settings-section about-settings-hero">
        <div className="about-settings-banner" role="img" aria-label={READANI_PRODUCT_NAME}>
          <img
            src={readaniBannerForLightTheme}
            alt=""
            aria-hidden="true"
            className="about-settings-banner-img about-settings-banner-img--light"
          />
          <img
            src={readaniBannerForDarkTheme}
            alt=""
            aria-hidden="true"
            className="about-settings-banner-img about-settings-banner-img--dark"
          />
        </div>
        <p className="about-settings-copyright">{READANI_COPYRIGHT_LINE}</p>
      </section>

      <section className="about-settings-section about-settings-meta">
        <p className="about-settings-meta-line about-settings-inline">
          <span>{t("about.version", { appVersion })}</span>
          <button
            className="about-settings-link-button"
            onClick={() => setChangelogOpen(true)}
            type="button"
          >
            {t("about.changelog")}
          </button>
        </p>
        <p className="about-settings-meta-line">
          Build {READANI_BUILD_TIMESTAMP_LABEL}
        </p>
        <p className="about-settings-meta-line about-settings-inline">
          <span>{READANI_AUTHOR_NAME}</span>
          <a
            aria-label={`Email ${READANI_AUTHOR_NAME}`}
            className="about-settings-icon-link"
            href={`mailto:${READANI_AUTHOR_EMAIL}`}
            title={READANI_AUTHOR_EMAIL}
          >
            <EnvelopeSimple size={16} weight="regular" />
          </a>
        </p>
      </section>

      <section className="about-settings-section about-settings-grid-section">
        <h3 className="about-settings-section-title">Special Thanks</h3>
        <ul className="about-settings-credit-list">
          <li className="about-settings-credit-item">
            <span className="about-settings-credit-name">
              <a
                className="about-settings-link"
                href={READANI_UPSTREAM_REPO_URL}
                rel="noreferrer"
                target="_blank"
              >
                {READANI_UPSTREAM_REPO_NAME}
              </a>
            </span>
            <span className="about-settings-credit-detail">
              by{" "}
              <a
                className="about-settings-link"
                href={READANI_UPSTREAM_AUTHOR_URL}
                rel="noreferrer"
                target="_blank"
              >
                {READANI_UPSTREAM_AUTHOR_NAME}
              </a>
              , the upstream reader project that helped inspire readani.
            </span>
          </li>
          <li className="about-settings-credit-item">
            <span className="about-settings-credit-name">
              <a
                className="about-settings-link"
                href={READANI_PHOSPHOR_URL}
                rel="noreferrer"
                target="_blank"
              >
                {READANI_PHOSPHOR_NAME}
              </a>
            </span>
            <span className="about-settings-credit-detail">
              the icon system used throughout the app.
            </span>
          </li>
        </ul>
      </section>

      {updateActionsEnabled && updateStatusMessage ? (
        <p className="about-settings-update-status" role="status">
          {updateStatusMessage}
        </p>
      ) : null}

      {updateActionsEnabled ? (
        <div className="about-settings-actions">
          <button
            className="btn btn-quiet-action about-settings-action"
            onClick={onCheckForUpdates}
            type="button"
          >
            <ArrowsClockwise size={16} weight="regular" />
            {t("about.checkForUpdate")}
          </button>
          <button
            className="btn btn-quiet-action about-settings-action"
            onClick={onOpenLatestRelease}
            title={READANI_RELEASES_URL}
            type="button"
          >
            <ArrowSquareOut size={16} weight="regular" />
            {t("about.openLatestRelease")}
          </button>
        </div>
      ) : null}

      <ChangelogDialog open={changelogOpen} onOpenChange={setChangelogOpen} />
    </div>
  );
}
