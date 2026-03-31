import BaseApiService from './BaseApiService';
import { buildQueryParams } from '@/utils/queryParams';
import { normalizePaginatedResponse } from '@/utils/normalizePaginatedResponse';

class ArticleServiceClass extends BaseApiService {
  constructor() {
    super('articles');
  }

  async getAll(filters = {}) {
    const qs = buildQueryParams(filters);
    const res = await this.get(qs ? `?${qs}` : '');
    return normalizePaginatedResponse(res, { requestedPage: filters?.page });
  }

  async getPageByUrl(url) {
    if (!url) return null;
    const res = await this.getByUrl(url);
    return res ? normalizePaginatedResponse(res) : null;
  }

  /** GET /dashboard/articles/:id — returns the article object (handles { article } or { data } response) */
  async getById(id) {
    const res = await this.get(`/${id}`);
    return res?.article ?? res?.data ?? res ?? null;
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

  async publish(id) {
    const res = await this.put(`/${id}/publish`);
    return res.data || res;
  }

  async unpublish(id) {
    const res = await this.put(`/${id}/unpublish`);
    return res.data || res;
  }

  /** PUT /dashboard/articles/:id/accept */
  async accept(id) {
    const res = await this.put(`/${id}/accept`);
    return res.data || res;
  }

  /** PUT /dashboard/articles/:id/reject */
  async reject(id) {
    const res = await this.put(`/${id}/reject`);
    return res.data || res;
  }

  /** GET /dashboard/articles/:id/edit — returns the article object */
  async getForEdit(id, options = {}) {
    const articleId = id != null ? String(id) : id;
    if (articleId == null || articleId === '') return null;
    const res = await this.request(`/${articleId}/edit`, { method: 'GET', omitLanguage: true, ...options });
    return res?.article ?? res?.data ?? res ?? null;
  }
}

export const ArticleService = new ArticleServiceClass();
