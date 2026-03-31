function pickText(val) {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    // common shapes: { ar, en } or { title, name, content, description }
    return (
      val.ar ??
      val.en ??
      val.title ??
      val.name ??
      val.content ??
      val.description ??
      ''
    );
  }
  return String(val);
}

function extractItem(res, keys = []) {
  if (!res) return null;
  for (const k of keys) {
    if (res?.[k] != null) return res[k];
  }
  return res?.data ?? res;
}

/**
 * Fetch edit data with a "no Accept-Language" neutral request, then fallback to
 * ar/en requests if we can't detect bilingual fields.
 *
 * @param {object} params
 * @param {(id: string|number, options?: any) => Promise<any>} params.getForEdit
 * @param {string|number} params.id
 * @param {string[]} params.extractKeys - keys to unwrap item from response (e.g. ['category','data'])
 * @param {string[]} params.bilingualFields - fields expected to be { ar, en } (e.g. ['name','description'])
 * @param {function(any): any} [params.transformNeutral] - optional normalization for the neutral item
 * @returns {Promise<any|null>} merged item
 */
export async function fetchBilingualEdit({
  getForEdit,
  id,
  extractKeys = [],
  bilingualFields = [],
  transformNeutral,
}) {
  const neutralRes = await getForEdit(id);
  const neutralRaw = extractItem(neutralRes, extractKeys);
  const neutral = typeof transformNeutral === 'function' ? transformNeutral(neutralRaw) : neutralRaw;
  if (!neutral) return null;

  const hasBilingual = bilingualFields.every((f) => {
    const v = neutral?.[f];
    return v && typeof v === 'object' && v.ar != null && v.en != null;
  });
  if (hasBilingual) return neutral;

  const [arRes, enRes] = await Promise.all([
    getForEdit(id, { headers: { 'Accept-Language': 'ar' } }),
    getForEdit(id, { headers: { 'Accept-Language': 'en' } }),
  ]);
  const arItem = extractItem(arRes, extractKeys) ?? {};
  const enItem = extractItem(enRes, extractKeys) ?? {};

  const merged = { ...neutral };
  for (const field of bilingualFields) {
    const arVal = pickText(arItem?.[field]) || pickText(neutral?.[field]);
    const enVal = pickText(enItem?.[field]) || pickText(neutral?.[field]);
    merged[field] = { ar: arVal, en: enVal };
  }
  return merged;
}

export { pickText, extractItem };

