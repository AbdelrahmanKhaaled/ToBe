import BaseApiService from './BaseApiService';
import { buildQueryParams } from '@/utils/queryParams';
import { normalizePaginatedResponse } from '@/utils/normalizePaginatedResponse';

class PostServiceClass extends BaseApiService {
  constructor() {
    super('posts');
  }

  async getAll(filters = {}) {
    const qs = buildQueryParams(filters);
    const res = await this.get(qs ? `?${qs}` : '');
    return normalizePaginatedResponse(res?.posts ?? res, { requestedPage: filters?.page });
  }

  async getPageByUrl(url) {
    if (!url) return null;
    const res = await this.getByUrl(url);
    return res ? normalizePaginatedResponse(res?.posts ?? res) : null;
  }

  async getById(id) {
    const res = await this.get(`/${id}`);
    return res?.data ?? res?.post ?? res;
  }

  /** GET /dashboard/posts/:id/edit — full shape for forms; falls back if route missing. */
  async getForEdit(id) {
    const postId = id != null ? String(id) : id;
    if (postId == null || postId === '') return null;
    try {
      const res = await this.request(`/${postId}/edit`, { method: 'GET', omitLanguage: true });
      return res?.post ?? res?.data ?? res ?? null;
    } catch {
      return this.getById(postId);
    }
  }

  async create(formData) {
    const res = await this.postFormData('', formData);
    return res?.data ?? res?.post ?? res;
  }

  /**
   * Update post: Laravel/PHP often expects POST + multipart (not raw PUT) for file fields.
   * We POST to /posts/:id with _method=PUT (same pattern as UserService multipart update).
   */
  async update(id, formData) {
    const postId = id != null ? String(id) : id;
    if (postId == null || postId === '') return null;
    if (formData instanceof FormData) {
      if (!formData.has('_method')) formData.append('_method', 'PUT');
      const res = await this.postFormData(`/${postId}`, formData);
      return res?.data ?? res?.post ?? res;
    }
    const qs = buildQueryParams(formData);
    return this.request(`/${postId}${qs ? `?${qs}` : ''}`, { method: 'PUT' });
  }

  async remove(id) {
    await this.deleteRequest(`/${id}`);
  }
}

export const PostService = new PostServiceClass();
