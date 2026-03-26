import BaseApiService from './BaseApiService';
import { buildQueryParams } from '@/utils/queryParams';
import { normalizePaginatedResponse } from '@/utils/normalizePaginatedResponse';

class WalletServiceClass extends BaseApiService {
  constructor() {
    super('wallets');
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

  /**
   * GET /dashboard/wallets/:id
   * Backend response shape may vary; we return the most likely payload.
   */
  async getById(id) {
    if (id === undefined || id === null || id === '') return null;
    const walletId = String(id);
    const res = await this.get(`/${walletId}`);
    return res?.wallet ?? res?.data ?? res ?? null;
  }
}

export const WalletService = new WalletServiceClass();

