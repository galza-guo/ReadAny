import { useCallback, useEffect, useRef } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { normalizeSelectionText } from "../lib/pageText";

const TEXT_LAYER_CLASS = "pdf-text-layer";

type PdfPageProps = {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  baseWidth: number;
  baseHeight: number;
  onSelectionText: (selection: { text: string; position: { x: number; y: number } }) => void;
  onClearSelection: () => void;
};

export function PdfPage({
  pdfDoc,
  pageNumber,
  scale,
  baseWidth,
  baseHeight,
  onSelectionText,
  onClearSelection,
}: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderPage() {
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });

      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
      }

      if (textLayerRef.current) {
        const { TextLayerBuilder } = await import("pdfjs-dist/web/pdf_viewer.mjs");
        const container = textLayerRef.current;
        container.innerHTML = "";
        container.classList.add(TEXT_LAYER_CLASS);
        const textLayer = new TextLayerBuilder({ pdfPage: page });
        textLayer.div.classList.add("pdf-text-layer-inner");
        await textLayer.render(viewport);
        if (cancelled) return;
        container.appendChild(textLayer.div);
      }
    }

    renderPage();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNumber, scale]);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const text = normalizeSelectionText(selection?.toString() ?? "");

    if (!selection || selection.rangeCount === 0 || !text) {
      onClearSelection();
      return;
    }

    const range = selection.getRangeAt(0);
    if (!textLayerRef.current?.contains(range.commonAncestorContainer)) {
      return;
    }

    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      onClearSelection();
      return;
    }

    onSelectionText({
      text,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
      },
    });
  }, [onClearSelection, onSelectionText]);

  return (
    <div
      className="pdf-page"
      style={{ width: baseWidth * scale, height: baseHeight * scale }}
      onMouseUp={handleMouseUp}
    >
      <canvas ref={canvasRef} className="pdf-canvas" />
      <div ref={textLayerRef} className="pdf-text-layer" />
    </div>
  );
}
