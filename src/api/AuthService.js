import BaseApiService from './BaseApiService';

class AuthServiceClass extends BaseApiService {
  constructor() {
    super(''); // dashboard root
  }

  async login(email, password) {
    const res = await this.post('/login', { email, password });
    const payload = res.data || res;
    return {
      token: payload.token || payload.access_token,
      user: payload.user || payload,
    };
  }

  async logout() {
    await this.post('/logout').catch(() => {});
  }

  /** POST /dashboard/logout-all-devices */
  async logoutAllDevices() {
    await this.post('/logout-all-devices').catch(() => {});
  }

  async getProfile() {
    const res = await this.get('/profile');
    return res.data || res;
  }

  /**
   * PUT /dashboard/user
   * Body: { name, email } (JSON)
   */
  async updateProfile(name, email, userId = null) {
    const payload = {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(userId != null && userId !== '' && { id: userId }),
    };
    const res = await this.put('/user', payload);
    return res.data || res;
  }

  /** PUT /dashboard/password — update current user password */
  async updatePassword(_currentPassword, newPassword, newPasswordConfirmation = null) {
    const body = {
      password: newPassword,
      password_confirmation: newPasswordConfirmation ?? newPassword,
    };
    const res = await this.put('/password', body);
    return res.data || res;
  }
}

export const AuthService = new AuthServiceClass();
