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
    const res = await this.postFormData(`/${id}?_method=PUT`, formData);
    return res.data || res;
  }

  async remove(id) {
    await this.deleteRequest(`/${id}`);
  }

  async publish(id) {
    const res = await this.post(`/${id}/publish?_method=PUT`);
    return res.data || res;
  }

  async unpublish(id) {
    const res = await this.post(`/${id}/unpublish?_method=PUT`);
    return res.data || res;
  }

  /** POST /dashboard/articles/:id/accept?_method=PUT */
  async accept(id) {
    const res = await this.post(`/${id}/accept?_method=PUT`);
    return res.data || res;
  }

  /** POST /dashboard/articles/:id/reject?_method=PUT */
  async reject(id) {
    const res = await this.post(`/${id}/reject?_method=PUT`);
    return res.data || res;
  }

  /** GET /dashboard/articles/:id/edit — returns the article object */
  async getForEdit(id) {
    const res = await this.get(`/${id}/edit`);
    return res?.article ?? res?.data ?? res ?? null;
  }
}

export const ArticleService = new ArticleServiceClass();
