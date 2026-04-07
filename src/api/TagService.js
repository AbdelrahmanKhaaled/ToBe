import BaseApiService from './BaseApiService';
import { buildQueryParams } from '@/utils/queryParams';
import { normalizePaginatedResponse } from '@/utils/normalizePaginatedResponse';

class TagServiceClass extends BaseApiService {
  constructor() {
    super('tags');
  }

  async getAll(filters = {}) {
    const qs = buildQueryParams(filters);
    const res = await this.get(qs ? `?${qs}` : '');
    return normalizePaginatedResponse(res?.tags ?? res, { requestedPage: filters?.page });
  }

  async getPageByUrl(url) {
    if (!url) return null;
    const res = await this.getByUrl(url);
    return res ? normalizePaginatedResponse(res?.tags ?? res) : null;
  }

  /** POST /dashboard/tags — form field: name */
  async create(formData) {
    const res = await this.postFormData('', formData);
    return res?.data ?? res?.tag ?? res;
  }

  /** PUT /dashboard/tags/:id?name=... (per Postman collection) */
  async update(id, name) {
    const tagId = id != null ? String(id) : id;
    if (tagId == null || tagId === '') return null;
    const qs = buildQueryParams({ name });
    return this.request(`/${tagId}${qs ? `?${qs}` : ''}`, { method: 'PUT' });
  }

  async remove(id) {
    await this.deleteRequest(`/${id}`);
  }
}

export const TagService = new TagServiceClass();
