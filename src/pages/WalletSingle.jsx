import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { WalletService } from '@/api';
import { Loading } from '@/components/ui';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

export function WalletSingle() {
  const { t } = useTranslation();
  const { id } = useParams();

  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const res = await WalletService.getById(id);
        if (!cancelled) setWallet(res);
      } catch (err) {
        if (!cancelled) toast.error(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading && !wallet) return <Loading />;

  const w = wallet ?? {};

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-primary)]">{t('wallets.title')}</h1>

      <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow)] border border-[var(--color-border)] p-5 space-y-2">
        <div>
          <span className="font-medium">{t('wallets.columns.id')}:</span> {w.id ?? w.wallet_id ?? w.walletId ?? id ?? '-'}
        </div>
        <div>
          <span className="font-medium">{t('wallets.columns.userId')}:</span> {w.user_id ?? w.userId ?? '-'}
        </div>
        <div>
          <span className="font-medium">{t('wallets.columns.balance')}:</span>{' '}
          {w.balance ?? w.amount ?? w.current_balance ?? w.currentBalance ?? w.total_amount ?? w.total ?? '-'}
        </div>
        <div>
          <span className="font-medium">{t('wallets.columns.createdAt')}:</span> {w.created_at ?? w.createdAt ?? '-'}
        </div>
      </div>

      <pre className="text-xs overflow-auto bg-gray-50 border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4">
        {JSON.stringify(wallet, null, 2)}
      </pre>
    </div>
  );
}

