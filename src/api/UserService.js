import BaseApiService from './BaseApiService';

class UserServiceClass extends BaseApiService {
  constructor() {
    super('users');
  }

  /** POST /dashboard/users */
  async create(payload) {
    const res = await this.post('', payload);
    return res.data || res;
  }
}

export const UserService = new UserServiceClass();

