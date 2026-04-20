import { describe, expect, test } from "bun:test";
import appCss from "./App.css?raw";

describe("split resize handle", () => {
  test("keeps the vertical separators hidden until a deliberate hover", () => {
    const splitHandleRule = appCss.match(/\.split-resize-handle::before\s*\{([^}]*)\}/)?.[1] ?? "";
    const splitHandleHoverRule =
      appCss.match(/\.split-resize-handle:hover::before\s*\{([^}]*)\}/)?.[1] ?? "";
    const splitHandleDraggingRule =
      appCss.match(/\.split-resize-handle\[data-dragging="true"\]::before\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(splitHandleRule).toContain("opacity: 0");
    expect(splitHandleRule).toContain("opacity 0.14s ease 0s");
    expect(splitHandleHoverRule).toContain("opacity: 1");
    expect(splitHandleHoverRule).toContain("transition-delay: 0.18s");
    expect(splitHandleDraggingRule).toContain("opacity: 1");
    expect(splitHandleDraggingRule).toContain("transition-delay: 0s");
  });
});
