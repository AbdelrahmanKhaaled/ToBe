import BaseApiService from './BaseApiService';
import { buildQueryParams } from '@/utils/queryParams';
import { normalizePaginatedResponse } from '@/utils/normalizePaginatedResponse';

class CurrencyServiceClass extends BaseApiService {
  constructor() {
    super('currencies');
  }

  async getAll(filters = {}) {
    const qs = buildQueryParams(filters);
    const res = await this.get(qs ? `?${qs}` : '');
    const payload = res?.currencies ?? res?.data ?? res;
    return normalizePaginatedResponse(payload, { requestedPage: filters?.page });
  }
}

export const CurrencyService = new CurrencyServiceClass();
