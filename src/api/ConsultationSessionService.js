import BaseApiService from './BaseApiService';
import { buildQueryParams } from '@/utils/queryParams';
import { normalizePaginatedResponse } from '@/utils/normalizePaginatedResponse';

class ConsultationSessionServiceClass extends BaseApiService {
  constructor() {
    super('consultation-sessions');
  }

  async getAll(filters = {}) {
    const qs = buildQueryParams(filters);
    const res = await this.get(qs ? `?${qs}` : '');
    // API may return { message, sessions: { data, links } }
    return normalizePaginatedResponse(res?.sessions ?? res?.consultation_sessions ?? res, { requestedPage: filters?.page });
  }

  async getPageByUrl(url) {
    if (!url) return null;
    const res = await this.getByUrl(url);
    return res ? normalizePaginatedResponse(res?.sessions ?? res?.consultation_sessions ?? res) : null;
  }

  async getById(id) {
    const res = await this.get(`/${id}`);
    return res?.session ?? res?.data ?? res;
  }

  /**
   * GET /dashboard/consultation-sessions/:id/edit
   * Default: do NOT send Accept-Language (can be overridden via options.headers).
   */
  async getForEdit(id, options = {}) {
    const sessionId = id != null ? String(id) : id;
    if (sessionId == null || sessionId === '') return null;
    return this.request(`/${sessionId}/edit`, { method: 'GET', omitLanguage: true, ...options });
  }

  async create(formData) {
    const res = await this.postFormData('', formData);
    return res?.session ?? res?.data ?? res;
  }

  async update(id, formData) {
    const endpoint = `/${id}`;
    const res = formData instanceof FormData
      ? await this.putFormData(endpoint, formData)
      : await this.put(endpoint, formData);
    return res?.session ?? res?.data ?? res;
  }

  async remove(id) {
    await this.deleteRequest(`/${id}`);
  }
}

export const ConsultationSessionService = new ConsultationSessionServiceClass();

