import { describe, expect, test } from "bun:test";
import {
  loadPdfPageViewport,
  renderPdfPageToScratchCanvas,
  syncCanvasToViewport,
} from "./pdfPageRender";

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("loadPdfPageViewport", () => {
  test("returns viewport data when the render is still current after page load resolves", async () => {
    const page = {
      getViewport: ({ scale }: { scale: number }) => ({
        width: 100 * scale,
        height: 200 * scale,
      }),
    };

    const result = await loadPdfPageViewport({
      loadPage: async () => page,
      pageNumber: 4,
      scale: 2.5,
      isCancelled: () => false,
    });

    expect(result?.page).toBe(page);
    expect(result?.viewport.width).toBe(250);
    expect(result?.viewport.height).toBe(500);
  });

  test("drops stale viewport work when cancellation happens before the async page load resolves", async () => {
    const pageReady = deferred<{
      getViewport: ({ scale }: { scale: number }) => { width: number; height: number };
    }>();
    let cancelled = false;

    const pendingResult = loadPdfPageViewport({
      loadPage: async () => pageReady.promise,
      pageNumber: 7,
      scale: 1,
      isCancelled: () => cancelled,
    });

    cancelled = true;
    pageReady.resolve({
      getViewport: ({ scale }) => ({
        width: 100 * scale,
        height: 200 * scale,
      }),
    });

    expect(await pendingResult).toBeNull();
  });
});

describe("renderPdfPageToScratchCanvas", () => {
  test("returns a rendered scratch canvas when the render stays current", async () => {
    const renderDone = deferred<unknown>();
    const renderTask = {
      cancel() {},
      promise: renderDone.promise,
    };
    const scratchCanvas = {
      width: 0,
      height: 0,
      getContext: () => ({}),
    };

    const pending = renderPdfPageToScratchCanvas({
      page: {
      },
      viewport: { width: 320, height: 480 },
      renderPage: () => renderTask,
      createCanvas: () => scratchCanvas,
      isCancelled: () => false,
    });

    renderDone.resolve(undefined);

    expect(await pending).toBe(scratchCanvas);
    expect(scratchCanvas.width).toBe(320);
    expect(scratchCanvas.height).toBe(480);
  });

  test("drops a scratch render that becomes stale before it completes", async () => {
    const renderDone = deferred<unknown>();
    const renderTask = {
      cancel() {},
      promise: renderDone.promise,
    };
    let cancelled = false;

    const pending = renderPdfPageToScratchCanvas({
      page: {
      },
      viewport: { width: 240, height: 360 },
      renderPage: () => renderTask,
      createCanvas: () => ({
        width: 0,
        height: 0,
        getContext: () => ({}),
      }),
      isCancelled: () => cancelled,
    });

    cancelled = true;
    renderDone.resolve(undefined);

    expect(await pending).toBeNull();
  });
});

describe("syncCanvasToViewport", () => {
  test("updates the visible canvas size immediately for the next viewport", () => {
    const clearRectCalls: Array<[number, number, number, number]> = [];
    const canvas = {
      width: 500,
      height: 800,
      style: {
        width: "500px",
        height: "800px",
      },
      getContext: () => ({
        clearRect: (...args: [number, number, number, number]) => {
          clearRectCalls.push(args);
        },
      }),
    };

    syncCanvasToViewport({
      canvas,
      viewport: { width: 240, height: 360 },
    });

    expect(canvas.width).toBe(240);
    expect(canvas.height).toBe(360);
    expect(canvas.style.width).toBe("240px");
    expect(canvas.style.height).toBe("360px");
    expect(clearRectCalls).toEqual([[0, 0, 240, 360]]);
  });
});
