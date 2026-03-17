import BaseApiService from './BaseApiService';
import { buildQueryParams } from '@/utils/queryParams';
import { normalizePaginatedResponse } from '@/utils/normalizePaginatedResponse';

class ConsultationSubCategoryServiceClass extends BaseApiService {
  constructor() {
    super('consultation-sub-categories');
  }

  async getAll(filters = {}) {
    const qs = buildQueryParams(filters);
    const res = await this.get(qs ? `?${qs}` : '');
    // API may return { message, sub_categories: { data, links } }
    return normalizePaginatedResponse(res?.sub_categories ?? res?.subCategories ?? res, { requestedPage: filters?.page });
  }

  async getPageByUrl(url) {
    if (!url) return null;
    const res = await this.getByUrl(url);
    return res ? normalizePaginatedResponse(res?.sub_categories ?? res?.subCategories ?? res) : null;
  }

  async getById(id) {
    const res = await this.get(`/${id}`);
    return res?.sub_category ?? res?.data ?? res;
  }

  async create(formData) {
    const res = await this.postFormData('', formData);
    return res?.sub_category ?? res?.data ?? res;
  }

  async update(id, formData) {
    const res = await this.postFormData(`/${id}?_method=PUT`, formData);
    return res?.sub_category ?? res?.data ?? res;
  }

  async remove(id) {
    await this.deleteRequest(`/${id}`);
  }
}

export const ConsultationSubCategoryService = new ConsultationSubCategoryServiceClass();

