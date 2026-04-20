import { describe, expect, test } from "bun:test";
import {
  DEFAULT_SIDEBAR_WIDTH,
  DEFAULT_SPLIT_LEFT_WIDTH,
  PDF_VIEWER_PADDING,
  SPLIT_GAP_WIDTH,
  clampPdfManualScale,
  clampSidebarWidth,
  clampSplitWidths,
  getPdfZoomPresetValue,
  resolvePdfScale,
  getResetSidebarWidth,
  getResetSplitWidths,
} from "./readerLayout";

describe("clampSidebarWidth", () => {
  test("keeps the sidebar above the minimum width", () => {
    expect(clampSidebarWidth(80, 1200)).toBe(180);
  });

  test("keeps room for the PDF page viewport", () => {
    expect(clampSidebarWidth(500, 528)).toBe(252);
  });

  test("never exceeds an undersized container", () => {
    expect(clampSidebarWidth(500, 120)).toBe(0);
  });
});

describe("clampSplitWidths", () => {
  test("keeps both reader panes above their minimum widths", () => {
    expect(
      clampSplitWidths({
        containerWidth: 900,
        leftPaneWidth: 850,
        rightPaneWidth: 50,
        gap: SPLIT_GAP_WIDTH,
      })
    ).toEqual({
      leftPaneWidth: 528,
      rightPaneWidth: 360,
    });
  });

  test("keeps ordinary split widths proportional when no min clamp is needed", () => {
    expect(
      clampSplitWidths({
        containerWidth: 1400,
        leftPaneWidth: 700,
        rightPaneWidth: 688,
        gap: SPLIT_GAP_WIDTH,
      })
    ).toEqual({
      leftPaneWidth: 700,
      rightPaneWidth: 688,
    });
  });

  test("keeps undersized split widths non-negative and inside the container", () => {
    const result = clampSplitWidths({
      containerWidth: 500,
      leftPaneWidth: 450,
      rightPaneWidth: 300,
      gap: SPLIT_GAP_WIDTH,
    });

    expect(result.leftPaneWidth).toBeGreaterThanOrEqual(0);
    expect(result.rightPaneWidth).toBeGreaterThanOrEqual(0);
    expect(result.leftPaneWidth + result.rightPaneWidth + SPLIT_GAP_WIDTH).toBeLessThanOrEqual(500);
  });
});

describe("reset widths", () => {
  test("returns the default sidebar width", () => {
    expect(getResetSidebarWidth()).toBe(DEFAULT_SIDEBAR_WIDTH);
  });

  test("returns the default split widths", () => {
    expect(getResetSplitWidths(1200)).toEqual({
      leftPaneWidth: DEFAULT_SPLIT_LEFT_WIDTH,
      rightPaneWidth: 1200 - SPLIT_GAP_WIDTH - DEFAULT_SPLIT_LEFT_WIDTH,
    });
  });

  test("keeps reset split widths non-negative for undersized containers", () => {
    const result = getResetSplitWidths(500);

    expect(result.leftPaneWidth).toBeGreaterThanOrEqual(0);
    expect(result.rightPaneWidth).toBeGreaterThanOrEqual(0);
    expect(result.leftPaneWidth + result.rightPaneWidth + SPLIT_GAP_WIDTH).toBeLessThanOrEqual(500);
  });
});

describe("resolvePdfScale", () => {
  test("uses the available viewer width for fit-width zoom", () => {
    expect(
      resolvePdfScale({
        mode: "fit-width",
        manualScale: 1,
        containerWidth: 900,
        containerHeight: 1200,
        pageWidth: 600,
        pageHeight: 800,
        padding: PDF_VIEWER_PADDING,
      })
    ).toBeCloseTo((900 - PDF_VIEWER_PADDING * 2) / 600);
  });

  test("uses the available viewer height for fit-height zoom", () => {
    expect(
      resolvePdfScale({
        mode: "fit-height",
        manualScale: 1,
        containerWidth: 900,
        containerHeight: 1200,
        pageWidth: 600,
        pageHeight: 800,
        padding: PDF_VIEWER_PADDING,
      })
    ).toBeCloseTo((1200 - PDF_VIEWER_PADDING * 2) / 800);
  });

  test("clamps manual PDF zoom into the supported range", () => {
    expect(clampPdfManualScale(0.2)).toBe(0.5);
    expect(clampPdfManualScale(3)).toBe(2.5);
  });
});

describe("getPdfZoomPresetValue", () => {
  test("returns fit modes directly", () => {
    expect(getPdfZoomPresetValue("fit-width", 1)).toBe("fit-width");
    expect(getPdfZoomPresetValue("fit-height", 1)).toBe("fit-height");
  });

  test("maps matching manual zoom to quick presets", () => {
    expect(getPdfZoomPresetValue("custom", 1)).toBe("100");
    expect(getPdfZoomPresetValue("custom", 1.5)).toBe("150");
  });

  test("returns empty string for non-preset custom zoom", () => {
    expect(getPdfZoomPresetValue("custom", 1.2)).toBe("");
  });
});
