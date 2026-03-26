import BaseApiService from './BaseApiService';
import { buildQueryParams } from '@/utils/queryParams';
import { normalizePaginatedResponse } from '@/utils/normalizePaginatedResponse';

class ConsultationCategoryServiceClass extends BaseApiService {
  constructor() {
    super('consultation-categories');
  }

  async getAll(filters = {}) {
    const qs = buildQueryParams(filters);
    const res = await this.get(qs ? `?${qs}` : '');
    // API may return { message, categories: { data, links } }
    return normalizePaginatedResponse(res?.categories ?? res, { requestedPage: filters?.page });
  }

  async getPageByUrl(url) {
    if (!url) return null;
    const res = await this.getByUrl(url);
    return res ? normalizePaginatedResponse(res?.categories ?? res) : null;
  }

  async getById(id) {
    const res = await this.get(`/${id}`);
    return res.category ?? res.data ?? res;
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
}

export const ConsultationCategoryService = new ConsultationCategoryServiceClass();

