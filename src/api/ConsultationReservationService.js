import BaseApiService from './BaseApiService';
import { buildQueryParams } from '@/utils/queryParams';
import { normalizePaginatedResponse } from '@/utils/normalizePaginatedResponse';

class ConsultationReservationServiceClass extends BaseApiService {
  constructor() {
    super('consultation-reservations');
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

  /** PATCH /dashboard/consultation-reservations/:id/status */
  async updateStatus(id, status) {
    const res = await this.request(`/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data || res;
  }
}

export const ConsultationReservationService = new ConsultationReservationServiceClass();

