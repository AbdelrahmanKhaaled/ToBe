import BaseApiService from './BaseApiService';
import { buildQueryParams } from '@/utils/queryParams';
import { normalizePaginatedResponse } from '@/utils/normalizePaginatedResponse';

class MentorServiceClass extends BaseApiService {
  constructor() {
    super('mentors');
  }

  static unwrapListResponse(res) {
    if (!res || typeof res !== 'object') return res;
    return res.mentors ?? res.mentor ?? res;
  }

  async getAll(filters = {}) {
    const qs = buildQueryParams(filters);
    const res = await this.get(qs ? `?${qs}` : '');
    const payload = MentorServiceClass.unwrapListResponse(res);
    return normalizePaginatedResponse(payload, { requestedPage: filters?.page });
  }

  async getPageByUrl(url) {
    if (!url) return null;
    const res = await this.getByUrl(url);
    if (!res) return null;
    const payload = MentorServiceClass.unwrapListResponse(res);
    return normalizePaginatedResponse(payload);
  }

  async getById(id) {
    const res = await this.get(`/${id}`);
    return res.data || res;
  }

  async create(formData) {
    const res = await this.postFormData('', formData);
    return res.data || res;
  }

  async update(id, payload) {
    const formData = payload instanceof FormData ? payload : (() => {
      const fd = new FormData();
      if (!payload || typeof payload !== 'object') return fd;
      for (const [key, value] of Object.entries(payload)) {
        if (value === undefined || value === null) continue;
        fd.append(key, String(value));
      }
      return fd;
    })();
    const res = await this.putFormData(`/${id}`, formData);
    return res.data || res;
  }

  async remove(id) {
    await this.deleteRequest(`/${id}`);
  }
}

export const MentorService = new MentorServiceClass();
