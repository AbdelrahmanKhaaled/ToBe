import BaseApiService from './BaseApiService';
import { buildQueryParams } from '@/utils/queryParams';
import { normalizePaginatedResponse } from '@/utils/normalizePaginatedResponse';

class UserServiceClass extends BaseApiService {
  constructor() {
    super('users');
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

  /** POST /dashboard/users */
  async create(payload) {
    const res = await this.post('', payload);
    return res.data || res;
  }

  /**
   * Update user.
   * Postman collection updates via POST /dashboard/users/:id using multipart/form-data,
   * including keys like: roles[role] and permissions[<index>].
   */
  async update(id, payload) {
    const userId = id != null ? String(id) : id;
    if (userId == null || userId === '') return null;

    const formData = new FormData();
    formData.append('name', payload?.name ?? '');
    formData.append('email', payload?.email ?? '');
    if (payload?.phone_number !== undefined) formData.append('phone_number', payload?.phone_number ?? '');
    if (payload?.phoneNumber !== undefined) formData.append('phone_number', payload?.phoneNumber ?? '');

    // role: single role id
    const roleId = Array.isArray(payload?.roles) ? payload.roles?.[0] : payload?.role ?? payload?.role_id ?? payload?.roleId ?? payload?.roles?.[0];
    if (roleId != null && roleId !== '') formData.append('roles[role]', String(roleId));

    // permissions: array of permission ids
    const permissions = Array.isArray(payload?.permissions) ? payload.permissions : payload?.permission_ids ?? payload?.permissionIds ?? [];
    permissions.forEach((permId, idx) => {
      if (permId == null || permId === '') return;
      // Postman example uses 1-based indexes: permissions[1], permissions[2]...
      formData.append(`permissions[${idx + 1}]`, String(permId));
    });

    // bank + deductions (optional)
    if (payload?.bank_name !== undefined) formData.append('bank_name', payload?.bank_name ?? '');
    if (payload?.bankName !== undefined) formData.append('bank_name', payload?.bankName ?? '');
    if (payload?.bank_account_name !== undefined) formData.append('bank_account_name', payload?.bank_account_name ?? '');
    if (payload?.bankAccountName !== undefined) formData.append('bank_account_name', payload?.bankAccountName ?? '');
    if (payload?.bank_account_number !== undefined) formData.append('bank_account_number', payload?.bank_account_number ?? '');
    if (payload?.bankAccountNumber !== undefined) formData.append('bank_account_number', payload?.bankAccountNumber ?? '');

    if (payload?.deduction_type !== undefined) formData.append('deduction_type', payload?.deduction_type ?? '');
    if (payload?.deductionType !== undefined) formData.append('deduction_type', payload?.deductionType ?? '');
    if (payload?.deduction_value !== undefined) formData.append('deduction_value', payload?.deduction_value ?? '');
    if (payload?.deductionValue !== undefined) formData.append('deduction_value', payload?.deductionValue ?? '');

    // Postman sends: POST /dashboard/users/:id with form-data
    const res = await this.postFormData(`/${userId}`, formData);
    return res.data || res;
  }

  async remove(id) {
    const userId = id != null ? String(id) : id;
    if (userId == null || userId === '') return;
    await this.deleteRequest(`/${userId}`);
  }
}

export const UserService = new UserServiceClass();

