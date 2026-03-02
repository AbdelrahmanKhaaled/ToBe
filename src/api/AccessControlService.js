import BaseApiService from './BaseApiService';

class RolesService extends BaseApiService {
  constructor() {
    super('roles');
  }

  /** GET /dashboard/roles */
  async listRoles() {
    const res = await this.get('');
    return res.data || res;
  }

  /** GET /dashboard/roles/:id */
  async getRole(id) {
    const res = await this.get(`/${id}`);
    return res.data || res;
  }
}

class PermissionsService extends BaseApiService {
  constructor() {
    super('permissions');
  }

  /** GET /dashboard/permissions */
  async listPermissions() {
    const res = await this.get('');
    return res.data || res;
  }
}

class UserRolesService extends BaseApiService {
  constructor() {
    super('users');
  }

  /** GET /dashboard/users/:id/roles-permissions */
  async getUserRolesAndPermissions(userId) {
    const res = await this.get(`/${userId}/roles-permissions`);
    return res.data || res;
  }

  /** POST /dashboard/users/:id/roles — assign roles */
  async assignRoles(userId, roles) {
    const body = { roles };
    const res = await this.post(`/${userId}/roles`, body);
    return res.data || res;
  }

  /** DELETE /dashboard/users/:id/roles — remove roles */
  async removeRoles(userId, roles) {
    const body = { roles };
    const res = await this.request(`/${userId}/roles`, {
      method: 'DELETE',
      body: JSON.stringify(body),
    });
    return res.data || res;
  }

  /** PUT /dashboard/users/:id/roles/sync — replace roles */
  async syncRoles(userId, roles) {
    const body = { roles };
    const res = await this.request(`/${userId}/roles/sync`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return res.data || res;
  }
}

export const AccessControlService = {
  roles: new RolesService(),
  permissions: new PermissionsService(),
  users: new UserRolesService(),
};

