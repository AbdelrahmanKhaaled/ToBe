import BaseApiService from './BaseApiService';

class AuthServiceClass extends BaseApiService {
  constructor() {
    super(''); // dashboard root
  }

  async login(email, password) {
    const res = await this.postUrlEncoded('/login', { email, password });
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
   * Update user profile. POST {{base_url}}/dashboard/user?_method=PUT&id=:id
   * Body: name, email (url-encoded).
   */
  async updateProfile(name, email, userId = null) {
    const id = userId != null && userId !== '' ? encodeURIComponent(userId) : '';
    const endpoint = id ? `/user?_method=PUT&id=${id}` : '/profile?_method=PUT';
    const res = await this.postUrlEncoded(endpoint, { name, email });
    return res.data || res;
  }

  /** POST /dashboard/password?_method=PUT — update current user password */
  async updatePassword(currentPassword, newPassword, newPasswordConfirmation = null) {
    const body = {
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: newPasswordConfirmation ?? newPassword,
    };
    const res = await this.post('/password?_method=PUT', body);
    return res.data || res;
  }
}

export const AuthService = new AuthServiceClass();
