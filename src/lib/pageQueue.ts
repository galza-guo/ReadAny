export function getPagesToTranslate(
  currentPage: number,
  totalPages: number,
  followingPageCount = 1,
) {
  const clampedFollowingPageCount = Math.max(
    0,
    Math.floor(Number.isFinite(followingPageCount) ? followingPageCount : 1),
  );
  const lastPage = Math.min(totalPages, currentPage + clampedFollowingPageCount);
  const pages: number[] = [];

  for (let page = currentPage; page <= lastPage; page += 1) {
    pages.push(page);
  }

  return pages;
}

export function clampPage(page: number, totalPages: number) {
  return Math.min(totalPages, Math.max(1, page));
}
