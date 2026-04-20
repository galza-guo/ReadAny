import { describe, expect, test } from "bun:test";
import type { GlyphItem } from "./textExtraction";
import { extractParagraphsFromGlyphs, filterWatermarks } from "./textExtraction";

function glyph(
  text: string,
  x: number,
  y: number,
  options: Partial<GlyphItem> = {}
): GlyphItem {
  return {
    text,
    x,
    y,
    w: 16,
    h: 16,
    lineId: -1,
    isVertical: false,
    columnIndex: 0,
    rotation: 0,
    direction: "ltr",
    styleVertical: false,
    ...options,
  };
}

describe("textExtraction", () => {
  test("reads vertical pages right to left while dropping header/footer noise", () => {
    const glyphs: GlyphItem[] = [
      glyph("115", 40, 20),
      glyph("海", 250, 20),
      glyph("峡", 270, 20),
      glyph("万", 290, 20),
      glyph("里", 310, 20),
      glyph("或", 520, 110, { direction: "ttb", styleVertical: true }),
      glyph("许", 520, 132, { direction: "ttb", styleVertical: true }),
      glyph("如", 520, 154, { direction: "ttb", styleVertical: true }),
      glyph("此", 520, 176, { direction: "ttb", styleVertical: true }),
      glyph("船", 480, 110, { direction: "ttb", styleVertical: true }),
      glyph("已", 480, 132, { direction: "ttb", styleVertical: true }),
      glyph("启", 480, 154, { direction: "ttb", styleVertical: true }),
      glyph("航", 480, 176, { direction: "ttb", styleVertical: true }),
    ];

    const paragraphs = extractParagraphsFromGlyphs(glyphs, {
      docId: "doc",
      pageIndex: 0,
      pageWidth: 600,
      pageHeight: 900,
    });

    expect(paragraphs.map((paragraph) => paragraph.source)).toEqual(["或 许 如 此 船 已 启 航"]);
  });

  test("does not classify vertical body text as a watermark just because it is rotated", () => {
    const { content, watermarks } = filterWatermarks([
      glyph("縦", 520, 110, {
        isVertical: true,
        rotation: 90,
        direction: "ttb",
        styleVertical: true,
      }),
    ]);

    expect(content).toHaveLength(1);
    expect(watermarks).toHaveLength(0);
  });
});
