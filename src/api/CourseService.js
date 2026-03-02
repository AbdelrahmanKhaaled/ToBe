import BaseApiService from './BaseApiService';
import { buildQueryParams } from '@/utils/queryParams';
import { normalizePaginatedResponse } from '@/utils/normalizePaginatedResponse';

class CourseServiceClass extends BaseApiService {
  constructor() {
    super('courses');
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

  async create(formData) {
    const res = await this.postFormData('', formData);
    return res.data || res;
  }

  async update(id, formData) {
    const res = await this.postFormData(`/${id}?_method=PUT`, formData);
    return res.data || res;
  }

  async remove(id) {
    const courseId = id != null ? String(id) : id;
    if (courseId == null || courseId === '') return;
    try {
      await this.deleteRequest(`/${courseId}`);
    } catch (err) {
      if (err?.response?.status === 405) {
        await this.post(`/${courseId}?_method=DELETE`, {});
      } else {
        throw err;
      }
    }
  }

  /** POST /dashboard/courses/:id/accept (Laravel: _method=PUT in query, JSON body) */
  async accept(id) {
    const courseId = id != null ? String(id) : id;
    const res = await this.post(`/${courseId}/accept?_method=PUT`, {});
    return res?.data ?? res;
  }

  /** POST /dashboard/courses/:id/reject (Laravel: _method=PUT in query, JSON body) */
  async reject(id) {
    const courseId = id != null ? String(id) : id;
    const res = await this.post(`/${courseId}/reject?_method=PUT`, {});
    return res?.data ?? res;
  }

  /** GET /dashboard/courses/:id/edit — returns the course object */
  async getForEdit(id) {
    const res = await this.get(`/${id}/edit`);
    return res?.course ?? res?.data ?? res ?? null;
  }
}

export const CourseService = new CourseServiceClass();
