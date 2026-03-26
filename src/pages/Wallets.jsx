import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WalletService } from '@/api';
import { Button, DataTable, IconView, Loading } from '@/components/ui';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

export function Wallets() {
  const { t } = useTranslation();

  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await WalletService.getAll({
        search: search || undefined,
        page,
        per_page: 10,
      });

      const rows = Array.isArray(res?.data) ? res.data : [];
      const normalized = rows.map((w, idx) => {
        const id = w?.id ?? w?.wallet_id ?? w?.walletId ?? w?.user_id ?? w?.userId ?? `${page}-${idx}`;
        return { ...w, id: id != null ? String(id) : `${page}-${idx}` };
      });

      setData(normalized);
      setMeta(res?.meta ?? null);
    } catch (err) {
      toast.error(err.message);
      setData([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchByUrl = useCallback(async (url) => {
    setLoading(true);
    try {
      const res = await WalletService.getPageByUrl(url);
      if (!res) return;

      const rows = Array.isArray(res?.data) ? res.data : [];
      const normalized = rows.map((w, idx) => {
        const id = w?.id ?? w?.wallet_id ?? w?.walletId ?? w?.user_id ?? w?.userId ?? String(idx);
        return { ...w, id: id != null ? String(id) : String(idx) };
      });

      setData(normalized);
      setMeta(res?.meta ?? null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data.length) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">{t('wallets.title')}</h1>
      </div>

      <DataTable
        columns={[
          { key: 'id', header: t('wallets.columns.id'), render: (w) => w.id ?? '-' },
          {
            key: 'user_id',
            header: t('wallets.columns.userId'),
            render: (w) => w.user_id ?? w.userId ?? '-',
          },
          {
            key: 'balance',
            header: t('wallets.columns.balance'),
            render: (w) =>
              w.balance ?? w.amount ?? w.current_balance ?? w.currentBalance ?? w.total_amount ?? w.total ?? '-',
          },
          {
            key: 'created_at',
            header: t('wallets.columns.createdAt'),
            render: (w) => w.created_at ?? w.createdAt ?? '-',
          },
        ]}
        data={data}
        meta={meta ?? undefined}
        onPageChange={(pageNum, linkUrl) => (linkUrl ? fetchByUrl(linkUrl) : setPage(pageNum))}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        emptyMessage={t('wallets.empty')}
        actions={(row) => (
          <div className="flex gap-1 justify-end">
            <Link to={`/wallets/${row.id}`}>
              <Button variant="ghost" className="!p-2 min-w-0" title="View" aria-label="View">
                <IconView />
              </Button>
            </Link>
          </div>
        )}
      />
    </div>
  );
}

