export function buildFormData(file, options = {}) {
  const formData = new FormData();
  formData.append(options.fieldName ?? 'file', file);
  if (options.additionalData) {
    for (const [key, value] of Object.entries(options.additionalData)) {
      formData.append(key, value);
    }
  }
  return formData;
}
