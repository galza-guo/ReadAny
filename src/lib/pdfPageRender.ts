type ViewportSource = {
  getViewport: (options: { scale: number }) => { width: number; height: number };
};

type RenderTaskLike = {
  cancel: () => void;
  promise: Promise<unknown>;
};

type ScratchCanvasLike<TContext> = {
  width: number;
  height: number;
  getContext: (contextId: "2d") => TContext | null;
};

type VisibleCanvasLike<TContext> = ScratchCanvasLike<TContext> & {
  style: {
    width: string;
    height: string;
  };
};

export async function loadPdfPageViewport<TPage extends ViewportSource>({
  loadPage,
  pageNumber,
  scale,
  isCancelled,
}: {
  loadPage: (pageNumber: number) => Promise<TPage>;
  pageNumber: number;
  scale: number;
  isCancelled: () => boolean;
}): Promise<{ page: TPage; viewport: ReturnType<TPage["getViewport"]> } | null> {
  const page = await loadPage(pageNumber);

  if (isCancelled()) {
    return null;
  }

  const viewport = page.getViewport({ scale }) as ReturnType<TPage["getViewport"]>;

  return {
    page,
    viewport,
  };
}

export async function renderPdfPageToScratchCanvas<
  TViewport extends { width: number; height: number },
  TContext,
  TPage,
  TCanvas extends ScratchCanvasLike<TContext>,
>({
  page,
  viewport,
  renderPage,
  createCanvas,
  isCancelled,
  onRenderTaskCreated,
}: {
  page: TPage;
  viewport: TViewport;
  renderPage: (page: TPage, options: { canvasContext: TContext; viewport: TViewport }) => RenderTaskLike;
  createCanvas: () => TCanvas;
  isCancelled: () => boolean;
  onRenderTaskCreated?: (task: RenderTaskLike) => void;
}): Promise<TCanvas | null> {
  const canvas = createCanvas();
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const renderTask = renderPage(page, { canvasContext: context, viewport });
  onRenderTaskCreated?.(renderTask);
  await renderTask.promise;

  if (isCancelled()) {
    return null;
  }

  return canvas;
}

export function syncCanvasToViewport<
  TViewport extends { width: number; height: number },
  TContext extends { clearRect?: (x: number, y: number, width: number, height: number) => void },
  TCanvas extends VisibleCanvasLike<TContext>,
>({
  canvas,
  viewport,
}: {
  canvas: TCanvas;
  viewport: TViewport;
}): void {
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  canvas.getContext("2d")?.clearRect?.(0, 0, canvas.width, canvas.height);
}
