import { API_CONFIG } from '@/config/api';
import { authStorage } from '@/utils/authStorage';
import { getCurrentLanguage } from '@/utils/language';

/**
 * Normalizes Laravel API errors.
 */
function normalizeError(error) {
  if (error instanceof Error) {
    const err = error;
    if (err.response) {
      const data = err.data || {};
      return {
        message: data.message || data.error || err.response.statusText || err.message,
        status: err.response.status,
        errors: data.errors,
      };
    }
    return { message: err.message };
  }
  return { message: 'An unexpected error occurred' };
}

/**
 * Base API service for Dashboard APIs.
 * All routes are under /dashboard/
 */
export default class BaseApiService {
  constructor(resource = '', baseUrl = API_CONFIG.baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.resource = resource ? `dashboard/${String(resource).replace(/^\//, '')}` : 'dashboard';
  }

  get url() {
    return `${this.baseUrl}/${this.resource}`;
  }

  getHeaders(omitContentType = false, omitLanguage = false) {
    const token = authStorage.getToken();
    const headers = {
      Accept: 'application/json',
      ...(!omitLanguage && { 'Accept-Language': getCurrentLanguage() }),
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    if (!omitContentType) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.url}${endpoint}`;
    const omitLanguage = options?.omitLanguage === true;
    const config = {
      ...options,
      headers: { ...this.getHeaders(options.body instanceof FormData, omitLanguage), ...options.headers },
    };
    delete config.omitLanguage;
    if (config.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    const response = await fetch(url, config);

    if (response.status === 401) {
      authStorage.clear();
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const err = new Error(data.message || data.error || response.statusText);
      err.response = response;
      err.data = data;
      throw err;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
  }

  async get(endpoint = '') {
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * GET request using a full URL (e.g. from API response "links").
   * Use this for pagination when the API returns link URLs for next/prev/first/last.
   */
  async getByUrl(fullUrl) {
    if (!fullUrl || typeof fullUrl !== 'string') return null;
    return this.request(fullUrl, { method: 'GET' });
  }

  async post(endpoint, body, useFormData = false) {
    const options = { method: 'POST' };
    if (body) {
      options.body = useFormData ? body : (typeof body === 'string' ? body : JSON.stringify(body));
    }
    return this.request(endpoint, options);
  }

  async postUrlEncoded(endpoint, params) {
    const body = new URLSearchParams(params).toString();
    return this.request(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  }

  async postFormData(endpoint, formData) {
    return this.post(endpoint, formData, true);
  }

  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async putFormData(endpoint, formData) {
    return this.request(endpoint, {
      method: 'PUT',
      body: formData,
    });
  }

  async patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async deleteRequest(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export { normalizeError };
