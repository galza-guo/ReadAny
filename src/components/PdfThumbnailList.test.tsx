import { describe, expect, test } from "bun:test";
import appCss from "../App.css?raw";

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

describe("PdfThumbnailList", () => {
  test("renders thumbnail page labels as centered plain numbers", () => {
    const source = Bun.file(
      "/Users/guolite/GitHub/readani/src/components/PdfThumbnailList.tsx",
    );

    const cardRule = normalizeWhitespace(
      appCss.match(/\.pdf-thumbnail-card\s*\{([^}]*)\}/)?.[1] ?? "",
    );
    const labelRule = normalizeWhitespace(
      appCss.match(/\.pdf-thumbnail-label\s*\{([^}]*)\}/)?.[1] ?? "",
    );

    expect(cardRule).toContain("text-align: center");
    expect(labelRule).toContain("text-align: center");
    expect(labelRule).toContain("font-variant-numeric: tabular-nums");

    return source.text().then((text) => {
      expect(text).toContain(
        '<span className="pdf-thumbnail-label">{pageNumber}</span>',
      );
      expect(text).not.toContain('t("reader.page")');
    });
  });
});
