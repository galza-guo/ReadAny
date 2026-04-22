import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import appCss from "../App.css?raw";
import { TranslationPane } from "./TranslationPane";

describe("TranslationPane", () => {
  test("renders cached state as an icon-only indicator", () => {
    const html = renderToStaticMarkup(
      <TranslationPane
        mode="pdf"
        currentPage={3}
        pageTranslation={{
          page: 3,
          displayText: "Original text",
          previousContext: "",
          nextContext: "",
          translatedText: "Translated text",
          status: "done",
          isCached: true,
        }}
        bulkActionLabel="Translate All"
        onBulkAction={() => {}}
        bulkActionDisabled={false}
        bulkActionRunning={false}
        onOpenSettings={() => {}}
        onRetryPage={() => {}}
        canRetryPage={true}
        selectionTranslation={null}
        onClearSelectionTranslation={() => {}}
      />,
    );

    expect(html).toContain("page-translation-cached-indicator");
    expect(html).not.toContain(">Cached<");
  });

  test("renders footer progress as plain text with a neutral bulk action button", () => {
    const html = renderToStaticMarkup(
      <TranslationPane
        mode="pdf"
        currentPage={3}
        pageTranslation={{
          page: 3,
          displayText: "Original text",
          previousContext: "",
          nextContext: "",
          translatedText: "Translated text",
          status: "done",
        }}
        progressLabel="3/9 pages translated"
        bulkActionLabel="Translate All"
        onBulkAction={() => {}}
        bulkActionDisabled={false}
        bulkActionRunning={false}
        onOpenSettings={() => {}}
        onRetryPage={() => {}}
        canRetryPage={true}
        selectionTranslation={null}
        onClearSelectionTranslation={() => {}}
      />,
    );

    expect(html).toContain("translation-pane-progress-text");
    expect(html).not.toContain("translation-progress-indicator");
    expect(html).toContain('class="btn btn-small btn-quiet-action"');
    expect(html).not.toContain("btn-primary btn-small");
  });

  test("renders a running progress detail beside the page count", () => {
    const html = renderToStaticMarkup(
      <TranslationPane
        mode="pdf"
        currentPage={3}
        progressLabel="3/9 pages translated"
        progressDetailLabel="Translating page 4"
        progressDetailState="running"
        bulkActionLabel="Stop Translating All"
        onBulkAction={() => {}}
        bulkActionDisabled={false}
        bulkActionRunning={true}
        onOpenSettings={() => {}}
        onRetryPage={() => {}}
        canRetryPage={true}
        selectionTranslation={null}
        onClearSelectionTranslation={() => {}}
      />,
    );

    expect(html).toContain("translation-pane-progress-detail is-running");
    expect(html).toContain("Translating page 4");
    expect(html).toContain("translation-pane-progress-ellipsis");
    expect(html).toContain(">Stop Translating All<");
  });

  test("renders loading state without the old boxed wrapper", () => {
    const html = renderToStaticMarkup(
      <TranslationPane
        mode="pdf"
        currentPage={3}
        pageTranslation={{
          page: 3,
          displayText: "Original text",
          previousContext: "",
          nextContext: "",
          status: "loading",
        }}
        loadingMessage="Translating this page..."
        bulkActionLabel="Translate All"
        onBulkAction={() => {}}
        bulkActionDisabled={false}
        bulkActionRunning={false}
        onOpenSettings={() => {}}
        onRetryPage={() => {}}
        canRetryPage={true}
        selectionTranslation={null}
        onClearSelectionTranslation={() => {}}
      />,
    );

    expect(html).toContain("page-translation-loading-state");
    expect(html).toContain("page-translation-loading-text");
    expect(html).toContain("Translating this page...");
    expect(html).not.toContain('page-translation-loading"');
  });

  test("renders a neutral placeholder instead of a fake loading state when nothing is running", () => {
    const html = renderToStaticMarkup(
      <TranslationPane
        mode="pdf"
        currentPage={3}
        bulkActionLabel="Translate All"
        onBulkAction={() => {}}
        bulkActionDisabled={false}
        bulkActionRunning={false}
        onOpenSettings={() => {}}
        onRetryPage={() => {}}
        canRetryPage={true}
        selectionTranslation={null}
        onClearSelectionTranslation={() => {}}
      />,
    );

    expect(html).toContain(
      "Translation will appear here when this page is ready.",
    );
    expect(html).not.toContain("Translating this page...");
  });

  test("uses a generic translation title in PDF mode", () => {
    const html = renderToStaticMarkup(
      <TranslationPane
        mode="pdf"
        currentPage={3}
        pageTranslation={{
          page: 3,
          displayText: "Original text",
          previousContext: "",
          nextContext: "",
          translatedText: "Translated text",
          status: "done",
        }}
        bulkActionLabel="Translate All"
        onBulkAction={() => {}}
        bulkActionDisabled={false}
        bulkActionRunning={false}
        onOpenSettings={() => {}}
        onRetryPage={() => {}}
        canRetryPage={true}
        selectionTranslation={null}
        onClearSelectionTranslation={() => {}}
      />,
    );

    expect(html).toContain(">Translation<");
    expect(html).toContain("rail-pane-title");
    expect(html).not.toContain("page-translation-label");
    expect(html).not.toContain(">Page 3<");
  });

  test("uses the shared pane title without page numbering in EPUB mode", () => {
    const html = renderToStaticMarkup(
      <TranslationPane
        mode="epub"
        pages={[]}
        currentPage={4}
        bulkActionLabel="Translate All"
        onBulkAction={() => {}}
        bulkActionDisabled={false}
        bulkActionRunning={false}
        onOpenSettings={() => {}}
        activePid={null}
        hoverPid={null}
        onHoverPid={() => {}}
        onTranslatePid={() => {}}
        onLocatePid={() => {}}
        onTranslateText={() => {}}
        wordTranslation={null}
        onClearWordTranslation={() => {}}
        scrollToPage={null}
      />,
    );

    expect(html).toContain(">Translation<");
    expect(html).toContain("rail-pane-title");
    expect(html).not.toContain("translation-pane-page");
    expect(html).not.toContain(">Page 4<");
  });

  test("uses the centered shared header rhythm without a translation-only divider", () => {
    const railHeaderRule =
      appCss.match(/\.rail-pane-header\s*\{([^}]*)\}/)?.[1] ?? "";
    const translationHeaderRule =
      appCss.match(/\.translation-pane-header\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(railHeaderRule).toContain("align-items: center");
    expect(translationHeaderRule).not.toContain("border-bottom");
  });

  test("does not render a vocabulary button in PDF mode", () => {
    const html = renderToStaticMarkup(
      <TranslationPane
        mode="pdf"
        currentPage={3}
        pageTranslation={{
          page: 3,
          displayText: "Original text",
          previousContext: "",
          nextContext: "",
          translatedText: "Translated text",
          status: "done",
        }}
        bulkActionLabel="Translate All"
        onBulkAction={() => {}}
        bulkActionDisabled={false}
        bulkActionRunning={false}
        onOpenSettings={() => {}}
        onRetryPage={() => {}}
        canRetryPage={true}
        selectionTranslation={null}
        onClearSelectionTranslation={() => {}}
      />,
    );

    expect(html).not.toContain('aria-label="Open vocabulary"');
  });

  test("does not render a vocabulary button in EPUB mode", () => {
    const html = renderToStaticMarkup(
      <TranslationPane
        mode="epub"
        pages={[]}
        currentPage={1}
        bulkActionLabel="Translate All"
        onBulkAction={() => {}}
        bulkActionDisabled={false}
        bulkActionRunning={false}
        onOpenSettings={() => {}}
        activePid={null}
        hoverPid={null}
        onHoverPid={() => {}}
        onTranslatePid={() => {}}
        onLocatePid={() => {}}
        onTranslateText={() => {}}
        wordTranslation={null}
        onClearWordTranslation={() => {}}
        scrollToPage={null}
      />,
    );

    expect(html).not.toContain('aria-label="Open vocabulary"');
  });

  test("renders the redo page action as a left-expanding icon button", () => {
    const html = renderToStaticMarkup(
      <TranslationPane
        mode="pdf"
        currentPage={3}
        pageTranslation={{
          page: 3,
          displayText: "Original text",
          previousContext: "",
          nextContext: "",
          translatedText: "Translated text",
          status: "done",
        }}
        bulkActionLabel="Translate All"
        onBulkAction={() => {}}
        bulkActionDisabled={false}
        bulkActionRunning={false}
        onOpenSettings={() => {}}
        onRetryPage={() => {}}
        canRetryPage={true}
        selectionTranslation={null}
        onClearSelectionTranslation={() => {}}
      />,
    );

    expect(html).toContain('class="btn btn-ghost expandable-icon-button"');
    expect(html).toContain('data-label-direction="left"');
    expect(html).toContain(">Redo page<");
    expect(html).toContain('aria-label="Redo page"');
  });

  test("renders the unavailable page message as plain italic copy with upright readani", () => {
    const html = renderToStaticMarkup(
      <TranslationPane
        mode="pdf"
        currentPage={3}
        pageTranslation={{
          page: 3,
          displayText: "",
          previousContext: "",
          nextContext: "",
          status: "unavailable",
        }}
        bulkActionLabel="Translate All"
        onBulkAction={() => {}}
        bulkActionDisabled={false}
        bulkActionRunning={false}
        onOpenSettings={() => {}}
        onRetryPage={() => {}}
        canRetryPage={false}
        selectionTranslation={null}
        onClearSelectionTranslation={() => {}}
      />,
    );

    const emptyRule =
      appCss.match(/\.page-translation-empty\s*\{([^}]*)\}/)?.[1] ?? "";
    const brandRule =
      appCss.match(/\.page-translation-empty-brand\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(html).toContain("This page does not contain any usable text yet.");
    expect(html).toContain("Please OCR it first, then reopen it in");
    expect(html).toContain('class="page-translation-empty-brand">readani<');
    expect(html).not.toContain("This PDF does not contain usable text yet.");
    expect(emptyRule).toContain("font-style: italic");
    expect(emptyRule).not.toContain("border:");
    expect(brandRule).toContain("font-style: normal");
  });

  test("renders a settings call-to-action when translation setup is required", () => {
    const html = renderToStaticMarkup(
      <TranslationPane
        mode="pdf"
        currentPage={3}
        pageTranslation={{
          page: 3,
          displayText: "Original text",
          previousContext: "",
          nextContext: "",
          status: "setup-required",
          error: "Translation is not set up yet.",
        }}
        setupRequired={true}
        bulkActionLabel="Translate All"
        onBulkAction={() => {}}
        bulkActionDisabled={false}
        bulkActionRunning={false}
        onOpenSettings={() => {}}
        onRetryPage={() => {}}
        canRetryPage={false}
        selectionTranslation={null}
        onClearSelectionTranslation={() => {}}
      />,
    );

    expect(html).toContain("translation-setup-prompt");
    expect(html).toContain("Translation is not set up yet.");
    expect(html).toContain("Open Settings to add a provider.");
  });

  test("keeps the page error state inline without a framed box", () => {
    const html = renderToStaticMarkup(
      <TranslationPane
        mode="pdf"
        currentPage={3}
        pageTranslation={{
          page: 3,
          displayText: "Original text",
          previousContext: "",
          nextContext: "",
          status: "error",
          error: "Could not reach the translation service.",
          errorChecks: [
            "Check your network connection.",
            "Check the Base URL in Settings.",
          ],
        }}
        bulkActionLabel="Translate All"
        onBulkAction={() => {}}
        bulkActionDisabled={false}
        bulkActionRunning={false}
        onOpenSettings={() => {}}
        onRetryPage={() => {}}
        canRetryPage={true}
        selectionTranslation={null}
        onClearSelectionTranslation={() => {}}
      />,
    );

    const errorRule =
      appCss.match(/(?:^|\n)\.page-translation-error\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(errorRule).toContain("justify-content: center");
    expect(errorRule).toContain("text-align: center");
    expect(errorRule).not.toContain("border:");
    expect(errorRule).not.toContain("background:");
    expect(errorRule).not.toContain("padding:");
    expect(html).toContain("Could not reach the translation service.");
    expect(html).toContain("Possible checks");
    expect(html).toContain("Check your network connection.");
  });
});
