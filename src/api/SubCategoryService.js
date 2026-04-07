import BaseApiService from './BaseApiService';
import { buildQueryParams } from '@/utils/queryParams';
import { normalizePaginatedResponse } from '@/utils/normalizePaginatedResponse';

class SubCategoryServiceClass extends BaseApiService {
  constructor() {
    super('sub-categories');
  }

  /** Laravel often returns { message, sub_categories: { data, links, ... } } */
  static unwrapListResponse(res) {
    if (!res || typeof res !== 'object') return res;
    return (
      res.sub_categories ??
      res.subCategories ??
      res['sub-categories'] ??
      res
    );
  }

  async getAll(filters = {}) {
    const qs = buildQueryParams(filters);
    const res = await this.get(qs ? `?${qs}` : '');
    const payload = SubCategoryServiceClass.unwrapListResponse(res);
    return normalizePaginatedResponse(payload, { requestedPage: filters?.page });
  }

  async getPageByUrl(url) {
    if (!url) return null;
    const res = await this.getByUrl(url);
    if (!res) return null;
    const payload = SubCategoryServiceClass.unwrapListResponse(res);
    return normalizePaginatedResponse(payload);
  }

  async getById(id) {
    const res = await this.get(`/${id}`);
    return res.data || res;
  }

  /**
   * GET /dashboard/sub-categories/:id/edit
   * Default: do NOT send Accept-Language (can be overridden via options.headers).
   */
  async getForEdit(id, options = {}) {
    const subCategoryId = id != null ? String(id) : id;
    if (subCategoryId == null || subCategoryId === '') return null;
    return this.request(`/${subCategoryId}/edit`, { method: 'GET', omitLanguage: true, ...options });
  }

  async create(formData) {
    const res = await this.postFormData('', formData);
    return res.data || res;
  }

  async update(id, formData) {
    const endpoint = `/${id}`;
    const res = formData instanceof FormData
      ? await this.putFormData(endpoint, formData)
      : await this.put(endpoint, formData);
    return res.data || res;
  }

  async remove(id) {
    await this.deleteRequest(`/${id}`);
  }
}

export const SubCategoryService = new SubCategoryServiceClass();

