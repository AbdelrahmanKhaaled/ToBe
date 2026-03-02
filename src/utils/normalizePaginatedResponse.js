/**
 * Normalize API "links" (Laravel-style object or array) to { first, last, prev, next, pages }.
 * - Object form: { first, last, prev, next } (full URLs or null)
 * - Array form: [ { url, label, page, active }, ... ] (we derive first/last/prev/next and keep pages for per-page URLs)
 * Returns { links, currentPage, lastPage } when raw is array so we can derive meta from it.
 */
function normalizeLinks(raw) {
  if (raw == null) return { links: null, currentPage: null, lastPage: null };

  const out = { first: null, last: null, prev: null, next: null, pages: null };
  let currentPage = null;
  let lastPage = null;

  if (Array.isArray(raw)) {
    const numericPages = raw.filter(
      (item) => item && typeof item === 'object' && /^\d+$/.test(String(item.label || '').trim())
    );
    let lastEntry = null;
    if (numericPages.length > 0) {
      out.pages = numericPages.map((item) => ({
        url: item.url || null,
        label: String(item.label ?? item.page ?? ''),
        active: !!item.active,
      }));
      const activeEntry = numericPages.find((item) => item.active);
      if (activeEntry != null) currentPage = Number(activeEntry.page ?? activeEntry.label ?? 1);
      lastEntry = numericPages[numericPages.length - 1];
      lastPage = Number(lastEntry?.page ?? lastEntry?.label ?? 1);
    }
    const firstLink = raw.find((item) => item && (String(item.label).toLowerCase().includes('first') || item.label === '1'));
    const lastLink = raw.find((item) => item && String(item.label).toLowerCase().includes('last'));
    const prevLink = raw.find((item) => item && (String(item.label).toLowerCase().includes('prev') || (item.label && item.label.includes('&laquo;'))));
    const nextLink = raw.find((item) => item && (String(item.label).toLowerCase().includes('next') || (item.label && item.label.includes('&raquo;'))));
    if (firstLink?.url) out.first = firstLink.url;
    if (lastLink?.url) out.last = lastLink.url;
    if (prevLink?.url) out.prev = prevLink.url;
    if (nextLink?.url) out.next = nextLink.url;
    if (!out.first && numericPages[0]?.url) out.first = numericPages[0].url;
    if (!out.last && lastEntry?.url) out.last = lastEntry.url;
    return { links: out, currentPage, lastPage };
  }

  if (typeof raw === 'object') {
    out.first = raw.first ?? raw.first_url ?? null;
    out.last = raw.last ?? raw.last_url ?? null;
    out.prev = raw.prev ?? raw.prev_url ?? null;
    out.next = raw.next ?? raw.next_url ?? null;
    if (Array.isArray(raw.pages)) out.pages = raw.pages.map((item) => ({ url: item?.url ?? null, label: item?.label ?? '', active: !!item?.active }));
  }
  return { links: out, currentPage: null, lastPage: null };
}

/**
 * Normalize Laravel (and similar) API list responses into { data, meta, links }.
 * Handles: paginated { data, meta, links }, meta.pagination, raw array, resource-named keys, and other shapes.
 * @param {object} res - Raw API response
 * @param {{ requestedPage?: number }} opts - Optional. requestedPage is used when the API doesn't return current_page (so UI stays in sync after fetching next/prev page).
 */
export function normalizePaginatedResponse(res, opts = {}) {
  const requestedPage = opts.requestedPage != null ? Number(opts.requestedPage) : undefined;
  const defaultPage = requestedPage != null && requestedPage >= 1 ? requestedPage : 1;

  if (res == null) {
    return { data: [], meta: { total: 0, perPage: 10, currentPage: defaultPage, lastPage: 1 }, links: null };
  }
  if (Array.isArray(res)) {
    return {
      data: res,
      meta: { total: res.length, perPage: res.length, currentPage: defaultPage, lastPage: 1 },
      links: null,
    };
  }
  let data = res.data ?? res;
  let arr = Array.isArray(data) ? data : (data?.data ?? []);
  let linksRaw = res.links ?? res.meta?.links ?? null;
  let containerMeta = null;

  if (!Array.isArray(arr) || arr.length === 0) {
    for (const value of Object.values(res)) {
      if (Array.isArray(value)) {
        arr = value;
        break;
      }
      if (value && typeof value === 'object' && Array.isArray(value.data)) {
        arr = value.data;
        if (value.links != null) linksRaw = value.links;
        containerMeta = value.meta || value;
        break;
      }
    }
  }
  if (!Array.isArray(arr)) arr = [];

  const meta = res.meta || containerMeta || {};
  const pagination = meta.pagination || meta;
  const total =
    meta.total ??
    pagination.total ??
    res.total ??
    (containerMeta && (containerMeta.total ?? containerMeta.pagination?.total)) ??
    (Array.isArray(res.data) ? res.data.length : undefined) ??
    arr.length;
  const totalNum = Number(total) || arr.length;
  const perPageNum = Number(meta.per_page ?? pagination.per_page ?? meta.perPage ?? 10) || 10;

  const { links: normalizedLinks, currentPage: linksCurrentPage, lastPage: linksLastPage } = normalizeLinks(linksRaw);
  const currentPageFromApi = Number(meta.current_page ?? pagination.current_page ?? meta.currentPage ?? 0) || 0;
  const currentPageNum =
    currentPageFromApi >= 1 ? currentPageFromApi : (linksCurrentPage >= 1 ? linksCurrentPage : defaultPage);
  const lastPageFromApi = Number(meta.last_page ?? pagination.last_page ?? meta.lastPage ?? 0) || 0;
  const lastPageNum =
    lastPageFromApi >= 1 ? lastPageFromApi : (linksLastPage >= 1 ? linksLastPage : (totalNum > 0 ? Math.max(1, Math.ceil(totalNum / perPageNum)) : 1));

  return {
    data: arr,
    meta: {
      total: totalNum,
      perPage: perPageNum,
      currentPage: currentPageNum,
      lastPage: lastPageNum,
      links: normalizedLinks,
    },
    links: normalizedLinks,
  };
}
