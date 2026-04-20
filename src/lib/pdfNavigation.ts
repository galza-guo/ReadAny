export type PdfNavTab = "thumbnails" | "contents";
export type PdfPageTurnDirection = "next" | "prev";

type StoredPdfNavTab = string | null | undefined;
type StoredPdfSidebarCollapsed = string | boolean | null | undefined;

type EdgePageTurnArgs = {
  deltaY: number;
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
  tolerance?: number;
};

type PdfOutlineItemLike = {
  title?: string;
  dest?: string | any[] | null;
  items?: PdfOutlineItemLike[];
};

type NormalizePdfOutlineResolver = {
  getPageNumberFromDest: (dest: string | any[]) => Promise<number | null | undefined>;
};

type PdfDestinationDocument = {
  getDestination: (name: string) => Promise<any[] | null>;
  getPageIndex: (ref: any) => Promise<number>;
};

export type PdfOutlineLink = {
  id: string;
  title: string;
  page: number;
  depth: number;
};

const DEFAULT_SCROLL_TOLERANCE = 2;

export function getInitialPdfNavTab(storedValue: StoredPdfNavTab): PdfNavTab {
  return storedValue === "contents" ? "contents" : "thumbnails";
}

export function getInitialPdfSidebarCollapsed(
  storedValue: StoredPdfSidebarCollapsed
): boolean {
  if (typeof storedValue === "boolean") {
    return storedValue;
  }

  return storedValue === "true";
}

export function decideEdgePageTurn({
  deltaY,
  scrollTop,
  clientHeight,
  scrollHeight,
  tolerance = DEFAULT_SCROLL_TOLERANCE,
}: EdgePageTurnArgs): PdfPageTurnDirection | null {
  const topEdge = scrollTop <= tolerance;
  const bottomEdge = scrollTop + clientHeight >= scrollHeight - tolerance;

  if (deltaY > 0 && bottomEdge) {
    return "next";
  }

  if (deltaY < 0 && topEdge) {
    return "prev";
  }

  return null;
}

export async function normalizePdfOutline(
  outline: PdfOutlineItemLike[] | null | undefined,
  resolver: NormalizePdfOutlineResolver
): Promise<PdfOutlineLink[]> {
  const links: PdfOutlineLink[] = [];

  async function visit(items: PdfOutlineItemLike[], depth: number, parentId: string) {
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const id = parentId ? `${parentId}-${index}` : String(index);
      const page = item.dest ? await resolver.getPageNumberFromDest(item.dest) : null;
      const title = item.title?.trim();

      if (page && title) {
        links.push({ id, title, page, depth });
      }

      if (item.items?.length) {
        await visit(item.items, depth + 1, id);
      }
    }
  }

  if (outline?.length) {
    await visit(outline, 0, "");
  }

  return links;
}

export async function resolvePdfDestinationPage(
  dest: string | any[] | null | undefined,
  document: PdfDestinationDocument
): Promise<number | null> {
  if (!dest) {
    return null;
  }

  const resolvedDest = typeof dest === "string" ? await document.getDestination(dest) : dest;
  const pageRef = resolvedDest?.[0];

  if (typeof pageRef === "number") {
    return pageRef + 1;
  }

  if (!pageRef) {
    return null;
  }

  try {
    const pageIndex = await document.getPageIndex(pageRef);
    return pageIndex + 1;
  } catch {
    return null;
  }
}
