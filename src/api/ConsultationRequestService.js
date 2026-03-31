import BaseApiService from './BaseApiService';
import { buildQueryParams } from '@/utils/queryParams';
import { normalizePaginatedResponse } from '@/utils/normalizePaginatedResponse';

class ConsultationRequestServiceClass extends BaseApiService {
  constructor() {
    super('consultation-requests');
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
    const requestId = id != null ? String(id) : id;
    if (requestId == null || requestId === '') return null;
    const res = await this.get(`/${requestId}`);
    return res?.request ?? res?.consultation_request ?? res?.data ?? res;
  }

  /** PATCH /dashboard/consultation-requests/:id/status */
  async updateStatus(id, status) {
    const requestId = id != null ? String(id) : id;
    if (requestId == null || requestId === '') return null;
    const res = await this.patch(`/${requestId}/status`, { status });
    return res?.data ?? res;
  }

  async remove(id) {
    const requestId = id != null ? String(id) : id;
    if (requestId == null || requestId === '') return;
    await this.deleteRequest(`/${requestId}`);
  }
}

export const ConsultationRequestService = new ConsultationRequestServiceClass();

