import BaseApiService from './BaseApiService';

class AboutServiceClass extends BaseApiService {
  constructor() {
    super('about-us');
  }

  /** GET /dashboard/about-us */
  async get() {
    const res = await this.get('');
    return res.data || res;
  }

  /**
   * POST /dashboard/about-us/update
   * Body (form-data): about_us_ar, about_us_en (can be HTML strings from editor)
   */
  async update({ aboutUsAr, aboutUsEn }) {
    const fd = new FormData();
    fd.append('about_us_ar', aboutUsAr ?? '');
    fd.append('about_us_en', aboutUsEn ?? '');
    const res = await this.postFormData('/update', fd);
    return res.data || res;
  }
}

export const AboutService = new AboutServiceClass();

