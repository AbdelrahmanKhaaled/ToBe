/**
 * Flatten Laravel validation errors into a readable string for toasts.
 */
export function formatApiError(err, fallback = 'Request failed') {
  const data = err?.data ?? err?.response?.data;
  const errors = data?.errors;
  if (errors && typeof errors === 'object') {
    const parts = Object.entries(errors).flatMap(([field, msgs]) => {
      const list = Array.isArray(msgs) ? msgs : [msgs];
      return list.filter(Boolean).map((m) => `${field}: ${m}`);
    });
    if (parts.length) return parts.join('\n');
  }
  return data?.message || err?.message || fallback;
}

export function toastApiError(err, toast, fallback) {
  toast.error(formatApiError(err, fallback));
}
