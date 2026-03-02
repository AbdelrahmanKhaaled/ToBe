import BaseApiService from './BaseApiService';
import { buildQueryParams } from '@/utils/queryParams';
import { normalizePaginatedResponse } from '@/utils/normalizePaginatedResponse';

class BannerServiceClass extends BaseApiService {
  constructor() {
    super('banners');
  }

  async getAll(filters = {}) {
    const qs = buildQueryParams(filters);
    const raw = await this.get(qs ? `?${qs}` : '');
    const res = raw?.banners ?? raw;
    return normalizePaginatedResponse(res, { requestedPage: filters?.page });
  }

  async getPageByUrl(url) {
    if (!url) return null;
    const raw = await this.getByUrl(url);
    const res = raw?.banners ?? raw;
    return res ? normalizePaginatedResponse(res) : null;
  }

  async getById(id) {
    const res = await this.get(`/${id}`);
    return res.data || res;
  }

  /**
   * Create banner.
   * Expected form-data fields:
   * - image (file)
   * - name_en, name_ar
   * - description_en, description_ar
   * - button_text_en, button_text_ar
   * - button_url
   */
  async create(formData) {
    const res = await this.postFormData('', formData);
    return res.data || res;
  }

  /**
   * Update banner main fields (no image).
   * Backend uses PUT /dashboard/banners/:id with JSON body.
   */
  async update(id, body) {
    const res = await this.put(`/${id}`, body);
    return res.data || res;
  }

  /**
   * Update banner image only.
   * POST /dashboard/banners/:id/update-img with form-data { image }
   */
  async updateImage(id, imageFile) {
    const fd = new FormData();
    if (imageFile) fd.append('image', imageFile);
    const res = await this.postFormData(`/${id}/update-img`, fd);
    return res.data || res;
  }

  async remove(id) {
    await this.deleteRequest(`/${id}`);
  }
}

export const BannerService = new BannerServiceClass();

