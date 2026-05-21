import { describe, expect, test } from "bun:test";

describe("PDF open flow", () => {
  test("yields to browser paint before starting the heavy PDF file read", async () => {
    const source = await Bun.file(new URL("./App.tsx", import.meta.url)).text();
    const loadPdfIndex = source.indexOf("const loadPdfFromPath = useCallback");
    const yieldIndex = source.indexOf(
      "await yieldToBrowserPaint();",
      loadPdfIndex,
    );
    const readIndex = source.indexOf(
      "const bytes = await readDocumentBytes(filePath);",
      loadPdfIndex,
    );

    expect(loadPdfIndex).toBeGreaterThan(-1);
    expect(yieldIndex).toBeGreaterThan(-1);
    expect(readIndex).toBeGreaterThan(-1);
    expect(yieldIndex).toBeLessThan(readIndex);
  });
});

describe("reader window sizing", () => {
  test("uses a fixed reader minimum width instead of pane-derived width", async () => {
    const source = await Bun.file(new URL("./App.tsx", import.meta.url)).text();

    expect(source).toContain("READER_WINDOW_MIN_WIDTH");
    expect(source).toContain("minWidth: READER_WINDOW_MIN_WIDTH");
    expect(source).toContain("useLayoutEffect(() => {\n    const shell = readerShellRef.current");
    expect(source).not.toContain("headerMinWidth");
    expect(source).not.toContain("contentMinWidth");
    expect(source).not.toContain("workspaceMinWidth + paddingX");
    expect(source).toContain("await appWindow.setSizeConstraints");
  });

  test("does not explicitly resize the window when panes are toggled", async () => {
    const source = await Bun.file(new URL("./App.tsx", import.meta.url)).text();

    expect(source).not.toContain("appWindow.innerSize()");
    expect(source).not.toContain("appWindow.setSize(");
  });

  test("includes the reader workspace border in its minimum width", async () => {
    const appCss = await Bun.file(new URL("./App.css", import.meta.url)).text();
    const workspaceRule = appCss.match(/\.app-main--workspace\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(workspaceRule).toContain("box-sizing: border-box");
  });
});
