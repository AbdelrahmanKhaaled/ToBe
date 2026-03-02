/**
 * Builds query string from filters / pagination params.
 */
export function buildQueryParams(params) {
  if (!params || typeof params !== 'object') return '';

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  return search.toString();
}
