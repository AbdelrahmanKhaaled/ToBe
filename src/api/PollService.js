import BaseApiService from './BaseApiService';
import { buildQueryParams } from '@/utils/queryParams';
import { normalizePaginatedResponse } from '@/utils/normalizePaginatedResponse';

class PollServiceClass extends BaseApiService {
  constructor() {
    super('polls');
  }

  async getAll(filters = {}) {
    const qs = buildQueryParams(filters);
    const res = await this.get(qs ? `?${qs}` : '');
    return normalizePaginatedResponse(res?.polls ?? res, { requestedPage: filters?.page });
  }

  async getPageByUrl(url) {
    if (!url) return null;
    const res = await this.getByUrl(url);
    return res ? normalizePaginatedResponse(res?.polls ?? res) : null;
  }

  /** GET /dashboard/polls/:id — show single poll (dashboard). */
  async getById(id) {
    const pollId = id != null ? String(id) : id;
    if (pollId == null || pollId === '') return null;
    const res = await this.get(`/${pollId}`);
    if (!res || typeof res !== 'object') return res;
    return res.poll ?? res.data?.poll ?? res.data ?? res;
  }

  async create(formData) {
    const res = await this.postFormData('', formData);
    return res?.data ?? res?.poll ?? res;
  }

  async update(id, formData) {
    const pollId = id != null ? String(id) : id;
    if (pollId == null || pollId === '') return null;
    if (formData instanceof FormData) {
      const res = await this.putFormData(`/${pollId}`, formData);
      return res?.data ?? res?.poll ?? res;
    }
    const qs = buildQueryParams(formData);
    return this.request(`/${pollId}${qs ? `?${qs}` : ''}`, { method: 'PUT' });
  }

  async remove(id) {
    await this.deleteRequest(`/${id}`);
  }
}

export const PollService = new PollServiceClass();
