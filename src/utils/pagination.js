export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export function getPaginationParams(params = {}) {
  return {
    page: params.page ?? 1,
    perPage: params.perPage ?? params.per_page ?? DEFAULT_PAGE_SIZE,
    per_page: params.per_page ?? params.perPage ?? DEFAULT_PAGE_SIZE,
    search: params.search ?? undefined,
    sortBy: params.sortBy ?? undefined,
    sortOrder: params.sortOrder ?? 'asc',
  };
}

export function getPageNumbers(currentPage, lastPage, delta = 2) {
  const pages = [];
  const left = Math.max(1, currentPage - delta);
  const right = Math.min(lastPage, currentPage + delta);
  for (let i = left; i <= right; i++) {
    pages.push(i);
  }
  return pages;
}

/**
 * Page numbers with current page last (rightmost before Next), matching design:
 * e.g. [lastPage, '...', currentPage-2, currentPage-1, currentPage]
 * Returns array of numbers and 'ellipsis' strings.
 */
export function getPageNumbersCurrentLast(currentPage, lastPage, delta = 2) {
  const run = [];
  const left = Math.max(1, currentPage - delta);
  for (let i = left; i <= currentPage; i++) {
    run.push(i);
  }
  if (lastPage > currentPage) {
    return [lastPage, 'ellipsis', ...run];
  }
  if (left > 1) {
    return ['ellipsis', ...run];
  }
  return run;
}
