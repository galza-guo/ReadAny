import type { PageDoc, PageTranslationState } from "../types";
import { hasUsablePageText } from "./pageText";

type PageTranslationProgressArgs = {
  pages: PageDoc[];
  pageTranslations: Record<number, PageTranslationState>;
  cachedPages: Iterable<number>;
};

type PageTranslationProgress = {
  translatedCount: number;
  totalCount: number;
  isFullyTranslated: boolean;
};

type DequeueNextPageArgs = {
  foregroundQueue: number[];
  backgroundQueue: number[];
  inFlightPages: Iterable<number>;
};

type DequeueNextPageResult = {
  page: number | null;
  foregroundQueue: number[];
  backgroundQueue: number[];
};

type RequestVersionResult = {
  versions: Record<number, number>;
  version: number;
};

function getPageSourceText(page?: PageDoc) {
  return (page?.paragraphs ?? [])
    .map((paragraph) => paragraph.source.trim())
    .filter(Boolean)
    .join("\n\n");
}

export function enqueueForegroundPage(queue: number[], page: number) {
  return [page, ...queue.filter((queuedPage) => queuedPage !== page)];
}

export function enqueueBackgroundPages(queue: number[], pages: number[]) {
  const nextQueue = [...queue];

  for (const page of pages) {
    if (!nextQueue.includes(page)) {
      nextQueue.push(page);
    }
  }

  return nextQueue;
}

export function dequeueNextPage({
  foregroundQueue,
  backgroundQueue,
  inFlightPages,
}: DequeueNextPageArgs): DequeueNextPageResult {
  const blockedPages = new Set(inFlightPages);

  for (let index = 0; index < foregroundQueue.length; index += 1) {
    const page = foregroundQueue[index];
    if (blockedPages.has(page)) {
      continue;
    }

    return {
      page,
      foregroundQueue: foregroundQueue.filter((queuedPage) => queuedPage !== page),
      backgroundQueue: backgroundQueue.filter((queuedPage) => queuedPage !== page),
    };
  }

  for (let index = 0; index < backgroundQueue.length; index += 1) {
    const page = backgroundQueue[index];
    if (blockedPages.has(page)) {
      continue;
    }

    return {
      page,
      foregroundQueue,
      backgroundQueue: backgroundQueue.filter((queuedPage) => queuedPage !== page),
    };
  }

  return {
    page: null,
    foregroundQueue,
    backgroundQueue,
  };
}

export function getPageTranslationProgress({
  pages,
  pageTranslations,
  cachedPages,
}: PageTranslationProgressArgs): PageTranslationProgress {
  const cachedPageSet = new Set(cachedPages);
  const translatablePages = pages.filter((page) => hasUsablePageText(getPageSourceText(page)));
  const translatedPages = translatablePages.filter((page) => {
    const translation = pageTranslations[page.page];
    return cachedPageSet.has(page.page) || translation?.status === "done";
  });

  return {
    translatedCount: translatedPages.length,
    totalCount: translatablePages.length,
    isFullyTranslated:
      translatablePages.length > 0 && translatedPages.length === translatablePages.length,
  };
}

export function getFullBookActionLabel(progress: PageTranslationProgress) {
  return progress.isFullyTranslated ? "Replace All" : "Translate All";
}

export function bumpRequestVersion(
  versions: Record<number, number>,
  page: number
): RequestVersionResult {
  const version = (versions[page] ?? 0) + 1;
  return {
    versions: {
      ...versions,
      [page]: version,
    },
    version,
  };
}

export function isRequestVersionCurrent(
  versions: Record<number, number>,
  page: number,
  version: number
) {
  return (versions[page] ?? 0) === version;
}
