import { describe, expect, test } from "bun:test";
import * as Toolbar from "@radix-ui/react-toolbar";
import { renderToStaticMarkup } from "react-dom/server";
import appCss from "../../App.css?raw";
import { PanelToggleGroup } from "./PanelToggleGroup";

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

describe("PanelToggleGroup", () => {
  test("renders the four reader panel segments with active states", () => {
    const html = renderToStaticMarkup(
      <Toolbar.Root>
        <PanelToggleGroup
          panels={{
            navigation: true,
            original: true,
            translation: false,
            chat: false,
          }}
          onToggle={() => {}}
        />
      </Toolbar.Root>
    );

    expect(html).toContain('class="segmented-toggle segmented-toggle--four panel-toggle-group"');
    expect(html).toContain(">Navigate<");
    expect(html).toContain(">Original<");
    expect(html).toContain(">Translate<");
    expect(html).toContain(">AI Chat<");
    expect(html).toContain('class="segmented-toggle-item panel-toggle-btn is-active"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
  });

  test("uses the same visible labels as the pane titles", () => {
    const source = Bun.file(
      "/Users/guolite/GitHub/readani/src/components/reader/PanelToggleGroup.tsx",
    );

    return source.text().then((text) => {
      expect(text).not.toContain("reader.panelChatShort");
      expect(text).not.toContain("reader.panelTranslateShort");
      expect(text).not.toContain("reader.panelNavigateShort");
      expect(text).not.toContain("reader.panelOriginalShort");
    });
  });

  test("disables the last visible active segment", () => {
    const html = renderToStaticMarkup(
      <Toolbar.Root>
        <PanelToggleGroup
          panels={{
            navigation: false,
            original: true,
            translation: false,
            chat: false,
          }}
          onToggle={() => {}}
        />
      </Toolbar.Root>
    );

    expect(html).toMatch(
      /<button[^>]*class="segmented-toggle-item panel-toggle-btn is-active"[^>]*disabled=""[^>]*>Original<\/button>/
    );
  });

  test("styles the toggle row as text-only labels in an even grid", () => {
    const groupRule = normalizeWhitespace(appCss.match(/\.segmented-toggle\s*\{([^}]*)\}/)?.[1] ?? "");
    const fourColumnRule = normalizeWhitespace(appCss.match(/\.segmented-toggle--four\s*\{([^}]*)\}/)?.[1] ?? "");

    expect(groupRule).toContain("display: grid");
    expect(fourColumnRule).toContain("grid-template-columns: repeat(4, minmax(0, 1fr))");
    expect(groupRule).not.toContain("border:");
    expect(groupRule).toContain("background: transparent");
    expect(groupRule).not.toContain("box-shadow:");
  });

  test("uses accent label states instead of button chrome", () => {
    const buttonRule = normalizeWhitespace(appCss.match(/\.segmented-toggle-item\s*\{([^}]*)\}/)?.[1] ?? "");
    const activeRule = appCss.match(/\.segmented-toggle-item\.is-active,\s*\.segmented-toggle-item\[data-state="active"\],\s*\.segmented-toggle-item\[data-state="on"\]\s*\{([^}]*)\}/)?.[1] ?? "";
    const hoverRule =
      appCss.match(/\.segmented-toggle-item:hover:not\(:disabled\)\s*\{([^}]*)\}/)?.[1] ?? "";
    const pressedRule =
      appCss.match(/\.segmented-toggle-item:active:not\(:disabled\)\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(buttonRule).toContain("background: transparent");
    expect(buttonRule).toContain("border: 0");
    expect(hoverRule).not.toContain("background");
    expect(hoverRule).toContain("color: var(--accent)");
    expect(activeRule).toContain("color: var(--accent-strong)");
    expect(activeRule).toContain("font-weight: 700");
    expect(activeRule).not.toContain("background");
    expect(activeRule).not.toContain("box-shadow");
    expect(appCss).not.toContain(".segmented-toggle-item::after");
    expect(pressedRule).toContain("color: var(--accent-strong)");
    expect(pressedRule).toContain("transform: translateY(1px)");
  });

  test("keeps the reader header flush with the shell background", () => {
    const headerRule = appCss.match(/\.app-header\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(headerRule).not.toContain("background");
    expect(headerRule).not.toContain("border-bottom");
  });

  test("gives the reader toolbar more top padding with a tighter gap below", () => {
    const readerShellRule = normalizeWhitespace(appCss.match(/\.app-shell-reader\s*\{([^}]*)\}/)?.[1] ?? "");
    const headerRule = normalizeWhitespace(appCss.match(/\.app-header\s*\{([^}]*)\}/)?.[1] ?? "");

    expect(readerShellRule).toContain("gap: 8px");
    expect(headerRule).toContain("padding: 14px 16px 8px");
  });

  test("pins the panel toggle row to the true horizontal center of the toolbar", () => {
    const headerRule = normalizeWhitespace(appCss.match(/\.app-header\s*\{([^}]*)\}/)?.[1] ?? "");
    const leftRule = normalizeWhitespace(appCss.match(/\.header-left\s*\{([^}]*)\}/)?.[1] ?? "");
    const centerRule = normalizeWhitespace(appCss.match(/\.header-center\s*\{([^}]*)\}/)?.[1] ?? "");
    const rightRule = normalizeWhitespace(appCss.match(/\.header-right\s*\{([^}]*)\}/)?.[1] ?? "");

    expect(headerRule).toContain("display: grid");
    expect(headerRule).toMatch(
      /grid-template-columns:\s*minmax\(\s*180px,\s*1fr\s*\)\s*minmax\(\s*440px,\s*1\.5fr\s*\)\s*minmax\(\s*180px,\s*1fr\s*\)/
    );
    expect(leftRule).toContain("width: 100%");
    expect(leftRule).toContain("justify-content: flex-start");
    expect(centerRule).toContain("grid-column: 2");
    expect(centerRule).toContain("width: 100%");
    expect(centerRule).toContain("justify-content: center");
    expect(rightRule).toContain("width: 100%");
    expect(rightRule).toContain("justify-content: flex-end");
  });
});
