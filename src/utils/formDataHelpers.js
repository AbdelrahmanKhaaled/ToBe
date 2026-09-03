/**
 * Append array values to FormData using 0-based Laravel keys: field[0], field[1], …
 */
export function appendArrayToFormData(formData, fieldName, values) {
  if (!(formData instanceof FormData) || !fieldName) return;
  const list = Array.isArray(values) ? values : [];
  list.forEach((value, index) => {
    if (value == null || String(value).trim() === '') return;
    formData.append(`${fieldName}[${index}]`, String(value).trim());
  });
}

/**
 * Append nested array objects: field[0][key], field[1][key], …
 */
export function appendNestedArrayToFormData(formData, fieldName, rows, keys) {
  if (!(formData instanceof FormData) || !fieldName || !Array.isArray(rows)) return;
  rows.forEach((row, index) => {
    if (!row || typeof row !== 'object') return;
    for (const key of keys) {
      const val = row[key];
      if (val == null || String(val).trim() === '') continue;
      formData.append(`${fieldName}[${index}][${key}]`, String(val).trim());
    }
  });
}

/** Append course/consultation prices: prices[i][currency_id], prices[i][price] */
export function appendPricesToFormData(formData, priceRows) {
  appendNestedArrayToFormData(formData, 'prices', priceRows, ['currency_id', 'price']);
}
