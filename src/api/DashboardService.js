import { CategoryService } from './CategoryService';
import { LevelService } from './LevelService';
import { MentorService } from './MentorService';
import { CourseService } from './CourseService';
import { LessonService } from './LessonService';
import { ArticleService } from './ArticleService';
import { FaqService } from './FaqService';
import { API_CONFIG } from '@/config/api';
import { authStorage } from '@/utils/authStorage';

const SERVICES = [
  { key: 'categories', getAll: (opts) => CategoryService.getAll(opts || {}), getPageByUrl: (url) => CategoryService.getPageByUrl(url) },
  { key: 'levels', getAll: (opts) => LevelService.getAll(opts || {}), getPageByUrl: (url) => LevelService.getPageByUrl(url) },
  { key: 'mentors', getAll: (opts) => MentorService.getAll(opts || {}), getPageByUrl: (url) => MentorService.getPageByUrl(url) },
  { key: 'courses', getAll: (opts) => CourseService.getAll(opts || {}), getPageByUrl: (url) => CourseService.getPageByUrl(url) },
  { key: 'lessons', getAll: (opts) => LessonService.getAll(opts || {}), getPageByUrl: (url) => LessonService.getPageByUrl(url) },
  { key: 'articles', getAll: (opts) => ArticleService.getAll(opts || {}), getPageByUrl: (url) => ArticleService.getPageByUrl(url) },
  { key: 'faqs', getAll: (opts) => FaqService.getAll(opts || {}), getPageByUrl: (url) => FaqService.getPageByUrl(url) },
];

/**
 * Get total count for one resource by following pagination links and counting all items.
 * When API sends a reliable meta.total (total > first page size when there are multiple pages),
 * we use it; otherwise we fetch every page via links.next and sum data.length.
 */
async function getTotalCountForService(service) {
  const first = await service.getAll({ page: 1, per_page: 10 });
  const meta = first?.meta ?? {};
  const totalFromMeta = Number(meta.total) || 0;
  const dataLen = Array.isArray(first?.data) ? first.data.length : 0;
  const lastPage = Number(meta.lastPage) || 1;

  // Use meta.total only if API clearly sent it (multiple pages => total should be > first page size)
  if (lastPage <= 1) {
    return dataLen;
  }
  if (totalFromMeta > dataLen) {
    return totalFromMeta;
  }

  // Count by following links: first page + all next pages
  let count = dataLen;
  let nextUrl = meta.links?.next ?? null;
  while (nextUrl) {
    const nextRes = await service.getPageByUrl(nextUrl);
    if (!nextRes) break;
    const nextData = nextRes?.data;
    const nextLen = Array.isArray(nextData) ? nextData.length : 0;
    count += nextLen;
    nextUrl = nextRes?.meta?.links?.next ?? null;
  }
  return count;
}

/**
 * Fetch total counts for all dashboard resources (all pages combined).
 * Uses meta.total when API provides it; otherwise follows pagination links and counts all items.
 * Returns { stats, errors } so UI can show what failed.
 */
export async function getStats() {
  const stats = {};
  const errors = {};
  for (const { key, getAll, getPageByUrl } of SERVICES) {
    const service = { getAll, getPageByUrl };
    try {
      stats[key] = await getTotalCountForService(service);
    } catch (err) {
      stats[key] = 0;
      errors[key] = err.message || (err.response ? `HTTP ${err.response.status}` : 'Request failed');
    }
  }
  return { stats, errors };
}

/**
 * Fetch recent courses and articles.
 */
export async function getRecent() {
  let recentCourses = [];
  let recentArticles = [];
  try {
    const coursesRes = await CourseService.getAll({ page: 1, per_page: 5 });
    recentCourses = Array.isArray(coursesRes?.data) ? coursesRes.data : [];
  } catch (_) {}
  try {
    const articlesRes = await ArticleService.getAll({ page: 1, per_page: 5 });
    recentArticles = Array.isArray(articlesRes?.data) ? articlesRes.data : [];
  } catch (_) {}
  return { recentCourses, recentArticles };
}

/**
 * Run a single raw GET to the dashboard API for diagnostics.
 * Returns { url, status, hasToken, bodyPreview, error }.
 */
export async function runDiagnostic() {
  const baseUrl = API_CONFIG.baseUrl.replace(/\/$/, '');
  const url = `${baseUrl}/dashboard/categories`;
  const hasToken = !!authStorage.getToken();
  const result = { url, hasToken, status: null, bodyPreview: null, error: null };
  try {
    const headers = {
      Accept: 'application/json',
      ...(hasToken && { Authorization: `Bearer ${authStorage.getToken()}` }),
    };
    const res = await fetch(url, { method: 'GET', headers });
    result.status = res.status;
    const text = await res.text();
    if (text.length > 0) {
      try {
        const json = JSON.parse(text);
        result.bodyPreview = JSON.stringify(json).slice(0, 500);
      } catch {
        result.bodyPreview = text.slice(0, 300);
      }
    }
    if (!res.ok) {
      result.error = text || res.statusText;
    }
  } catch (err) {
    result.error = err.message || String(err);
  }
  return result;
}

export const DashboardService = {
  getStats,
  getRecent,
  runDiagnostic,
};
