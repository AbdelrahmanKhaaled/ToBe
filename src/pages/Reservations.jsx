import { useCallback, useEffect, useMemo, useState } from 'react';
import { ReservationService } from '@/api';
import { DataTable, Button, Loading } from '@/components/ui';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

export function Reservations() {
  const { t } = useTranslation();

  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [updatingId, setUpdatingId] = useState(null);
  const [statusDrafts, setStatusDrafts] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ReservationService.getAll({ search: search || undefined, page, per_page: 10 });
      setData(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchByUrl = useCallback(async (url) => {
    setLoading(true);
    try {
      const res = await ReservationService.getPageByUrl(url);
      if (res) {
        setData(res.data);
        setMeta(res.meta);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const draftForRow = useMemo(() => {
    const m = new Map();
    for (const r of data) {
      m.set(String(r.id), statusDrafts[String(r.id)] ?? r.status ?? '');
    }
    return m;
  }, [data, statusDrafts]);

  const updateStatus = async (row) => {
    const id = row.id;
    const nextStatus = draftForRow.get(String(id)) ?? '';
    if (!nextStatus) {
      toast.error(t('reservations.statusRequired', 'Please select a status'));
      return;
    }
    setUpdatingId(id);
    try {
      await ReservationService.updateStatus(id, nextStatus);
      toast.success(t('reservations.statusUpdated', 'Status updated'));
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && !data.length) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">{t('reservations.title', 'Reservations')}</h1>
      </div>

      <DataTable
        columns={[
          { key: 'id', header: t('reservations.columns.id', 'ID'), render: (r) => r.id },
          { key: 'status', header: t('reservations.columns.status', 'Status'), render: (r) => r.status ?? '-' },
          { key: 'created_at', header: t('reservations.columns.createdAt', 'Created at'), render: (r) => r.created_at ?? '-' },
        ]}
        data={data}
        meta={meta ?? undefined}
        onPageChange={(pageNum, linkUrl) => (linkUrl ? fetchByUrl(linkUrl) : setPage(pageNum))}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        emptyMessage={t('reservations.empty', 'No reservations yet')}
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <select
              value={draftForRow.get(String(row.id)) ?? ''}
              onChange={(e) => setStatusDrafts((p) => ({ ...p, [String(row.id)]: e.target.value }))}
              className="px-2 py-1 rounded border border-[var(--color-border)] bg-white text-sm"
              aria-label="Status"
            >
              <option value="">{t('reservations.selectStatus', 'Select status')}</option>
              <option value="pending">{t('reservations.statuses.pending', 'Pending')}</option>
              <option value="confirmed">{t('reservations.statuses.confirmed', 'Confirmed')}</option>
              <option value="cancelled">{t('reservations.statuses.cancelled', 'Cancelled')}</option>
              <option value="paid">{t('reservations.statuses.paid', 'Paid')}</option>
            </select>
            <Button
              type="button"
              loading={updatingId === row.id}
              onClick={() => updateStatus(row)}
              className="whitespace-nowrap"
            >
              {t('reservations.updateStatus', 'Update status')}
            </Button>
          </div>
        )}
      />
    </div>
  );
}

