import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { UserService } from '@/api';
import { Loading } from '@/components/ui';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

function isBlockedStatus(status) {
  return String(status ?? '').trim().toLowerCase() === 'blocked';
}

function roleNames(roleRaw) {
  if (!roleRaw) return '—';
  const arr = Array.isArray(roleRaw) ? roleRaw : [roleRaw];
  const names = arr
    .map((r) => {
      if (!r) return null;
      if (typeof r === 'string') return r;
      return r?.name ?? null;
    })
    .filter(Boolean);
  return names.length ? names.join(', ') : '—';
}

export function UserSingle() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!id) return undefined;
    (async () => {
      setLoading(true);
      try {
        const data = await UserService.getById(id);
        if (!cancelled) setItem(data ?? null);
      } catch (err) {
        if (!cancelled) toast.error(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleStatusToggle = async () => {
    if (!id || !item || statusUpdating) return;
    const blocked = isBlockedStatus(item.status);
    const next = blocked ? 'active' : 'blocked';
    setStatusUpdating(true);
    try {
      await UserService.updateStatus(id, next);
      setItem((prev) => (prev ? { ...prev, status: next } : prev));
      toast.success(t('users.statusUpdated', 'Status updated'));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) return <Loading />;
  if (!item) {
    return (
      <div>
        <Link to="/users" className="text-[var(--color-accent)] hover:underline mb-4 inline-block">
          ← {t('users.backToList', 'Back to admins')}
        </Link>
        <p className="text-gray-500">{t('users.notFound', 'User not found.')}</p>
      </div>
    );
  }

  const balance = item.wallet_balance != null && typeof item.wallet_balance === 'object'
    ? item.wallet_balance.balance
    : null;

  const points =
    item.points ??
    item.user_points ??
    item.earning_points ??
    item.earningPoints ??
    null;

  const InfoRow = ({ label, children }) => (
    <div className="px-4 py-3">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-[var(--color-primary)]">{children}</dd>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <Link to="/users" className="text-[var(--color-accent)] hover:underline">
          ← {t('users.backToList', 'Back to admins')}
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">
        {t('users.singleTitle', 'User details')}
      </h1>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] overflow-hidden">
        <dl className="divide-y divide-[var(--color-border)]">
          <InfoRow label={t('users.name')}>{item.name ?? '—'}</InfoRow>
          <InfoRow label={t('users.email')}>{item.email ?? '—'}</InfoRow>
          <InfoRow label={t('users.phoneNumber')}>
            {item.phone_number ?? item.phoneNumber ?? '—'}
          </InfoRow>
          <InfoRow label={t('users.detailRole', 'Role')}>{roleNames(item.role ?? item.roles)}</InfoRow>
          <InfoRow label={t('users.detailStatus', 'Status')}>
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-medium capitalize">{item.status ?? '—'}</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isBlockedStatus(item.status) ? 'text-gray-500' : 'text-[var(--color-primary)]'}`}>
                  {t('users.statusBlocked', 'Blocked')}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!isBlockedStatus(item.status)}
                  aria-label={t('users.toggleStatusAria', 'Toggle user active or blocked')}
                  disabled={statusUpdating}
                  onClick={handleStatusToggle}
                  className={`flex h-8 w-14 shrink-0 items-center rounded-full px-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 disabled:opacity-50 ${
                    isBlockedStatus(item.status) ? 'bg-gray-300' : 'bg-[var(--color-accent)]'
                  }`}
                >
                  <span
                    className={`h-6 w-6 rounded-full bg-white shadow transition-[margin] duration-200 ease-out ${
                      isBlockedStatus(item.status) ? '' : 'ms-auto'
                    }`}
                  />
                </button>
                <span className={`text-sm ${!isBlockedStatus(item.status) ? 'text-[var(--color-primary)]' : 'text-gray-500'}`}>
                  {t('users.statusActive', 'Active')}
                </span>
              </div>
            </div>
          </InfoRow>
          <InfoRow label={t('users.points', 'Points')}>
            {points != null && points !== '' ? String(points) : '—'}
          </InfoRow>
          <InfoRow label={t('users.walletBalance', 'Wallet balance')}>
            {balance != null && balance !== '' ? String(balance) : '—'}
          </InfoRow>
        </dl>
      </div>
    </div>
  );
}
