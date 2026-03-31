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
    return normalizePaginatedResponse(res?.courses ?? res, { requestedPage: filters?.page });
  }

  async getPageByUrl(url) {
    if (!url) return null;
    const res = await this.getByUrl(url);
    return res ? normalizePaginatedResponse(res?.courses ?? res) : null;
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
    const endpoint = `/${id}`;
    const res = formData instanceof FormData
      ? await this.putFormData(endpoint, formData)
      : await this.put(endpoint, formData);
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

  /** PUT /dashboard/courses/:id/accept */
  async accept(id) {
    const courseId = id != null ? String(id) : id;
    const res = await this.put(`/${courseId}/accept`, {});
    return res?.data ?? res;
  }

  /** PUT /dashboard/courses/:id/reject */
  async reject(id) {
    const courseId = id != null ? String(id) : id;
    const res = await this.put(`/${courseId}/reject`, {});
    return res?.data ?? res;
  }

  /** GET /dashboard/courses/:id/edit — returns the course object */
  async getForEdit(id, options = {}) {
    const courseId = id != null ? String(id) : id;
    if (courseId == null || courseId === '') return null;
    const res = await this.request(`/${courseId}/edit`, { method: 'GET', omitLanguage: true, ...options });
    return res?.course ?? res?.data ?? res ?? null;
  }
}

export const CourseService = new CourseServiceClass();
