export function getPagesToTranslate(currentPage: number, totalPages: number) {
  const pages = [currentPage];

  if (currentPage + 1 <= totalPages) {
    pages.push(currentPage + 1);
  }

  return pages;
}

export function clampPage(page: number, totalPages: number) {
  return Math.min(totalPages, Math.max(1, page));
}
