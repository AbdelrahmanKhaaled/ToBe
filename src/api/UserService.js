import BaseApiService from './BaseApiService';
import { buildQueryParams } from '@/utils/queryParams';
import { normalizePaginatedResponse } from '@/utils/normalizePaginatedResponse';
import { appendArrayToFormData } from '@/utils/formDataHelpers';

class UserServiceClass extends BaseApiService {
  constructor() {
    super('users');
  }

  static unwrapListResponse(res) {
    if (!res || typeof res !== 'object') return res;
    return res.users ?? res.user ?? res;
  }

  static buildUserFormData(payload, { includePassword = false } = {}) {
    const fd = new FormData();
    if (payload?.name != null) fd.append('name', String(payload.name));
    if (payload?.email != null) fd.append('email', String(payload.email));
    if (payload?.phone_number !== undefined) fd.append('phone_number', payload.phone_number ?? '');
    if (payload?.phoneNumber !== undefined) fd.append('phone_number', payload.phoneNumber ?? '');

    const roleId = Array.isArray(payload?.roles)
      ? payload.roles?.[0]
      : payload?.role ?? payload?.role_id ?? payload?.roleId;
    if (roleId != null && roleId !== '') {
      fd.append('roles[role]', String(roleId));
      appendArrayToFormData(fd, 'roles', [roleId]);
    }

    const permissions = Array.isArray(payload?.permissions)
      ? payload.permissions
      : payload?.permission_ids ?? payload?.permissionIds ?? [];
    appendArrayToFormData(fd, 'permissions', permissions);

    if (includePassword && payload?.password) {
      fd.append('password', String(payload.password));
      fd.append('password_confirmation', String(payload.password_confirmation ?? payload.password));
    }

    if (payload?.bank_name !== undefined) fd.append('bank_name', payload.bank_name ?? '');
    if (payload?.bankName !== undefined) fd.append('bank_name', payload.bankName ?? '');
    if (payload?.bank_account_name !== undefined) fd.append('bank_account_name', payload.bank_account_name ?? '');
    if (payload?.bankAccountName !== undefined) fd.append('bank_account_name', payload.bankAccountName ?? '');
    if (payload?.bank_account_number !== undefined) fd.append('bank_account_number', payload.bank_account_number ?? '');
    if (payload?.bankAccountNumber !== undefined) fd.append('bank_account_number', payload.bankAccountNumber ?? '');
    if (payload?.deduction_type !== undefined) fd.append('deduction_type', payload.deduction_type ?? '');
    if (payload?.deductionType !== undefined) fd.append('deduction_type', payload.deductionType ?? '');
    if (payload?.deduction_value !== undefined) fd.append('deduction_value', payload.deduction_value ?? '');
    if (payload?.deductionValue !== undefined) fd.append('deduction_value', payload.deductionValue ?? '');

    return fd;
  }

  async getAll(filters = {}) {
    const qs = buildQueryParams(filters);
    const res = await this.get(qs ? `?${qs}` : '');
    const payload = UserServiceClass.unwrapListResponse(res);
    return normalizePaginatedResponse(payload, { requestedPage: filters?.page });
  }

  async getPageByUrl(url) {
    if (!url) return null;
    const res = await this.getByUrl(url);
    if (!res) return null;
    const payload = UserServiceClass.unwrapListResponse(res);
    return normalizePaginatedResponse(payload);
  }

  async getById(id) {
    const uid = id != null ? String(id) : id;
    if (uid == null || uid === '') return null;
    const res = await this.get(`/${uid}`);
    return res?.data ?? res?.user ?? res;
  }

  async updateStatus(id, status) {
    const uid = id != null ? String(id) : id;
    if (uid == null || uid === '') return null;
    const fd = new FormData();
    fd.append('status', status);
    const res = await this.postFormData(`/${uid}/change-status`, fd);
    return res?.data ?? res;
  }

  /** POST /dashboard/users (multipart) */
  async create(payload) {
    const fd = UserServiceClass.buildUserFormData(payload, { includePassword: true });
    const res = await this.postFormData('', fd);
    return res.data || res;
  }

  /** POST /dashboard/users/:id with _method=PUT */
  async update(id, payload) {
    const userId = id != null ? String(id) : id;
    if (userId == null || userId === '') return null;

    const formData = UserServiceClass.buildUserFormData(payload, { includePassword: Boolean(payload?.password) });
    formData.append('_method', 'PUT');
    const res = await this.postFormData(`/${userId}`, formData);
    return res.data || res;
  }

  async remove(id) {
    const userId = id != null ? String(id) : id;
    if (userId == null || userId === '') return;
    await this.deleteRequest(`/${userId}`);
  }

  /** DELETE /dashboard/users/bulk-delete — body: { ids: number[] } */
  async bulkDelete(ids) {
    const list = (Array.isArray(ids) ? ids : []).map((id) => Number(id)).filter((id) => !Number.isNaN(id));
    if (!list.length) return;
    return this.request('/bulk-delete', {
      method: 'DELETE',
      body: JSON.stringify({ ids: list }),
    });
  }
}

export const UserService = new UserServiceClass();
