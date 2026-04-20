export const DEFAULT_SIDEBAR_WIDTH = 252;
export const MIN_SIDEBAR_WIDTH = 180;

export const DEFAULT_SPLIT_LEFT_WIDTH = 640;
export const MIN_LEFT_PANE_WIDTH = 528;
export const MIN_RIGHT_PANE_WIDTH = 360;
export const SPLIT_GAP_WIDTH = 12;
export const MIN_PDF_VIEWPORT_WIDTH = Math.max(0, MIN_LEFT_PANE_WIDTH - DEFAULT_SIDEBAR_WIDTH);
export const PDF_VIEWER_PADDING = 20;
export const PDF_MANUAL_ZOOM_MIN = 0.5;
export const PDF_MANUAL_ZOOM_MAX = 2.5;

export type PdfZoomMode = "fit-width" | "fit-height" | "custom";
export type PdfZoomPresetValue = PdfZoomMode | "100" | "150" | "";

export function clampSidebarWidth(width: number, containerWidth: number): number {
  const safeContainerWidth = Math.max(0, containerWidth);
  const maxWidth = Math.max(0, safeContainerWidth - MIN_PDF_VIEWPORT_WIDTH);
  const minWidth =
    safeContainerWidth < MIN_SIDEBAR_WIDTH + MIN_PDF_VIEWPORT_WIDTH
      ? 0
      : Math.min(MIN_SIDEBAR_WIDTH, maxWidth);

  return Math.max(minWidth, Math.min(Math.max(0, width), maxWidth));
}

export function clampSplitWidths({
  containerWidth,
  leftPaneWidth,
  rightPaneWidth,
  gap,
}: {
  containerWidth: number;
  leftPaneWidth: number;
  rightPaneWidth: number;
  gap: number;
}): { leftPaneWidth: number; rightPaneWidth: number } {
  const safeContainerWidth = Math.max(0, containerWidth);
  const safeGap = Math.max(0, gap);
  const availableWidth = Math.max(0, safeContainerWidth - safeGap);
  const requestedLeft = Math.max(0, leftPaneWidth);
  const requestedRight = Math.max(0, rightPaneWidth);
  const minimumTotalWidth = MIN_LEFT_PANE_WIDTH + MIN_RIGHT_PANE_WIDTH;

  if (availableWidth === 0) {
    return {
      leftPaneWidth: 0,
      rightPaneWidth: 0,
    };
  }

  if (availableWidth < minimumTotalWidth) {
    const requestedTotalWidth = requestedLeft + requestedRight;

    if (requestedTotalWidth === 0) {
      const leftPaneWidth = Math.floor(availableWidth / 2);

      return {
        leftPaneWidth,
        rightPaneWidth: availableWidth - leftPaneWidth,
      };
    }

    const leftPaneWidth = Math.round((availableWidth * requestedLeft) / requestedTotalWidth);

    return {
      leftPaneWidth,
      rightPaneWidth: availableWidth - leftPaneWidth,
    };
  }

  const preferredTotalWidth = requestedLeft + requestedRight;
  const preferredLeftPaneWidth =
    preferredTotalWidth === 0 ? DEFAULT_SPLIT_LEFT_WIDTH : Math.round((availableWidth * requestedLeft) / preferredTotalWidth);
  // In normal desktop-sized layouts, keep the split proportional while enforcing the minimums.
  const clampedLeftPaneWidth = Math.max(
    MIN_LEFT_PANE_WIDTH,
    Math.min(preferredLeftPaneWidth, availableWidth - MIN_RIGHT_PANE_WIDTH)
  );

  return {
    leftPaneWidth: clampedLeftPaneWidth,
    rightPaneWidth: availableWidth - clampedLeftPaneWidth,
  };
}

export function getResetSidebarWidth(): number {
  return DEFAULT_SIDEBAR_WIDTH;
}

export function getResetSplitWidths(containerWidth: number): { leftPaneWidth: number; rightPaneWidth: number } {
  const availableWidth = Math.max(0, containerWidth - SPLIT_GAP_WIDTH);
  const leftPaneWidth = Math.min(DEFAULT_SPLIT_LEFT_WIDTH, availableWidth);

  return {
    leftPaneWidth,
    rightPaneWidth: availableWidth - leftPaneWidth,
  };
}

export function clampPdfManualScale(scale: number): number {
  return Math.max(PDF_MANUAL_ZOOM_MIN, Math.min(PDF_MANUAL_ZOOM_MAX, scale));
}

export function getPdfZoomPresetValue(mode: PdfZoomMode, manualScale: number): PdfZoomPresetValue {
  if (mode === "fit-width" || mode === "fit-height") {
    return mode;
  }

  if (Math.abs(manualScale - 1) < 0.001) {
    return "100";
  }

  if (Math.abs(manualScale - 1.5) < 0.001) {
    return "150";
  }

  return "";
}

export function resolvePdfScale({
  mode,
  manualScale,
  containerWidth,
  containerHeight,
  pageWidth,
  pageHeight,
  padding = PDF_VIEWER_PADDING,
}: {
  mode: PdfZoomMode;
  manualScale: number;
  containerWidth: number;
  containerHeight: number;
  pageWidth: number;
  pageHeight: number;
  padding?: number;
}): number {
  if (mode === "custom") {
    return clampPdfManualScale(manualScale);
  }

  if (pageWidth <= 0 || pageHeight <= 0) {
    return 1;
  }

  const availableWidth = Math.max(0, containerWidth - padding * 2);
  const availableHeight = Math.max(0, containerHeight - padding * 2);

  if (mode === "fit-height") {
    return availableHeight > 0 ? availableHeight / pageHeight : 1;
  }

  return availableWidth > 0 ? availableWidth / pageWidth : 1;
}
