import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import appCss from "../App.css?raw";
import { PdfViewer } from "./PdfViewer";

describe("PdfViewer", () => {
  test("renders the zoom dock in a viewer shell layer, outside the scroll content", () => {
    const html = renderToStaticMarkup(
      <PdfViewer
        pdfDoc={{} as any}
        pageSizes={[{ width: 100, height: 200 }]}
        currentPage={1}
        zoomMode="custom"
        manualScale={1}
        scrollAnchor="top"
        onNavigateToPage={() => {}}
        onRequestPageChange={() => {}}
        onZoomModeChange={() => {}}
        onManualScaleChange={() => {}}
        onResolvedScaleChange={() => {}}
        onSelectionText={() => {}}
        onClearSelection={() => {}}
      />
    );

    expect(html).toContain('class="pdf-viewer-shell"');
    expect(html).toContain('class="pdf-viewer"');
    expect(html).toContain('class="pdf-zoom-dock"');
    expect(html).toContain('class="pdf-page"');
    expect(html).not.toContain('class="pdf-page-stage"');
    expect(html).toContain('</div></div><div class="pdf-zoom-dock"');
  });

  test("positions the viewer shell as the zoom dock anchor layer", () => {
    const shellRule = appCss.match(/\.pdf-viewer-shell\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(shellRule).toContain("position: relative");
    expect(shellRule).toContain("min-height: 0");
  });
});
