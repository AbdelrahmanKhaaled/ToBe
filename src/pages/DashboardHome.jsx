import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardService } from '@/api';
import { Loading } from '@/components/ui';
import { useTranslation } from 'react-i18next';

function StatCard({ label, value, error, to }) {
  const content = (
    <div className="p-6 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-md)] transition-shadow">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-[var(--color-primary)] mt-2">{value}</p>
      {error && (
        <p className="text-xs text-red-500 mt-1 truncate" title={error}>
          {error}
        </p>
      )}
    </div>
  );
  if (to) {
    return <Link to={to}>{content}</Link>;
  }
  return content;
}

function getTitle(item) {
  return item?.title ?? item?.translations?.ar?.title ?? item?.translations?.en?.title ?? item?.name ?? '—';
}

export function DashboardHome() {
  const { t } = useTranslation();

  const [stats, setStats] = useState(null);
  const [errors, setErrors] = useState({});
  const [recent, setRecent] = useState({ recentCourses: [], recentArticles: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    setErrors({});
    try {
      const [statsResult, recentRes] = await Promise.all([
        DashboardService.getStats(),
        DashboardService.getRecent(),
      ]);
      setStats(statsResult.stats || {});
      setErrors(statsResult.errors || {});
      setRecent(recentRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !stats) {
    return <Loading />;
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">
          {t('dashboard.title')}
        </h1>
        <div className="p-6 bg-red-50 border border-red-200 rounded-[var(--radius-lg)] text-red-700">
          {t('dashboard.loadError')}: {error}
        </div>
      </div>
    );
  }

  const s = stats || {};
  const e = errors || {};

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">
        {t('dashboard.title')}
      </h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-4">
          {t('dashboard.overview')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <StatCard
            label={t('dashboard.categories')}
            value={s.categories ?? 0}
            error={e.categories}
            to="/categories"
          />
          <StatCard
            label={t('dashboard.levels')}
            value={s.levels ?? 0}
            error={e.levels}
            to="/levels"
          />
          <StatCard
            label={t('dashboard.mentors')}
            value={s.mentors ?? 0}
            error={e.mentors}
            to="/mentors"
          />
          <StatCard
            label={t('dashboard.courses')}
            value={s.courses ?? 0}
            error={e.courses}
            to="/courses"
          />
          <StatCard
            label={t('dashboard.lessons')}
            value={s.lessons ?? 0}
            error={e.lessons}
            to="/lessons"
          />
          <StatCard
            label={t('dashboard.articles')}
            value={s.articles ?? 0}
            error={e.articles}
            to="/articles"
          />
          <StatCard
            label={t('dashboard.faqs')}
            value={s.faqs ?? 0}
            error={e.faqs}
            to="/faqs"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)]">
          <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-4">
            {t('dashboard.recentCourses')}
          </h2>
          {recent.recentCourses?.length ? (
            <ul className="space-y-2">
              {recent.recentCourses.map((item) => (
                <li key={item.id}>
                  <Link to="/courses" className="text-[var(--color-accent)] hover:underline">
                    {getTitle(item)}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">{t('dashboard.noCourses')}</p>
          )}
        </div>

        <div className="p-6 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)]">
          <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-4">
            {t('dashboard.recentArticles')}
          </h2>
          {recent.recentArticles?.length ? (
            <ul className="space-y-2">
              {recent.recentArticles.map((item) => (
                <li key={item.id}>
                  <Link to="/articles" className="text-[var(--color-accent)] hover:underline">
                    {getTitle(item)}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">{t('dashboard.noArticles')}</p>
          )}
        </div>
      </section>
    </div>
  );
}
