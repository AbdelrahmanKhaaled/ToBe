import BaseApiService from './BaseApiService';
import { buildQueryParams } from '@/utils/queryParams';
import { normalizePaginatedResponse } from '@/utils/normalizePaginatedResponse';

class LessonServiceClass extends BaseApiService {
  constructor() {
    super('lessons');
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

  async getById(id) {
    const res = await this.get(`/${id}`);
    return res.data || res;
  }

  async create(data) {
    if (data instanceof FormData) {
      const res = await this.postFormData('', data);
      return res.data || res;
    }
    const res = await this.post('', data);
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

  /** GET /dashboard/lessons/:course_id/next-order */
  async getNextOrder(courseId) {
    const res = await this.get(`/${courseId}/next-order`);
    return res.data ?? res;
  }

  /** GET /dashboard/lessons/:id/edit */
  async getForEdit(id, options = {}) {
    const lessonId = id != null ? String(id) : id;
    if (lessonId == null || lessonId === '') return null;
    const res = await this.request(`/${lessonId}/edit`, { method: 'GET', omitLanguage: true, ...options });
    return res.data || res;
  }
}

export const LessonService = new LessonServiceClass();
