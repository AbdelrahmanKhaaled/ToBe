import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConsultationRequestService } from '@/api';
import { DataTable, Button, Loading, IconView, IconTrash, IconCheck } from '@/components/ui';
import { toast } from '@/utils/toast';
import { useConfirm } from '@/utils/confirmDialog';
import { useTranslation } from 'react-i18next';

export function ConsultationRequests() {
  const { t } = useTranslation();
  const confirm = useConfirm();

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
      const res = await ConsultationRequestService.getAll({ search: search || undefined, page, per_page: 10 });
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
      const res = await ConsultationRequestService.getPageByUrl(url);
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
      toast.error(t('consultationRequests.statusRequired', 'Please select a status'));
      return;
    }
    setUpdatingId(id);
    try {
      await ConsultationRequestService.updateStatus(id, nextStatus);
      toast.success(t('consultationRequests.statusUpdated', 'Status updated'));
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (row) => {
    const id = row?.id;
    if (!id) return;
    const ok = await confirm({
      title: t('consultationRequests.deleteTitle', 'Delete request'),
      message: t('consultationRequests.deleteMessage', 'Delete this request?'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await ConsultationRequestService.remove(id);
      toast.success(t('consultationRequests.deleted', 'Request deleted'));
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading && !data.length) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">
          {t('consultationRequests.title', 'Consultation requests')}
        </h1>
      </div>

      <DataTable
        columns={[
          { key: 'id', header: t('consultationRequests.columns.id', 'ID'), render: (r) => r.id },
          { key: 'status', header: t('consultationRequests.columns.status', 'Status'), render: (r) => r.status ?? '-' },
          { key: 'created_at', header: t('consultationRequests.columns.createdAt', 'Created at'), render: (r) => r.created_at ?? '-' },
        ]}
        data={data}
        meta={meta ?? undefined}
        onPageChange={(pageNum, linkUrl) => (linkUrl ? fetchByUrl(linkUrl) : setPage(pageNum))}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        emptyMessage={t('consultationRequests.empty', 'No requests yet')}
        actions={(row) => (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link to={`/consultation-requests/${row.id}`}>
              <Button variant="ghost" className="!p-2 min-w-0" title={t('common.view')} aria-label={t('common.view')}>
                <IconView />
              </Button>
            </Link>
            <select
              value={draftForRow.get(String(row.id)) ?? ''}
              onChange={(e) => setStatusDrafts((p) => ({ ...p, [String(row.id)]: e.target.value }))}
              className="px-2 py-1 rounded border border-[var(--color-border)] bg-white text-sm"
              aria-label="Status"
            >
              <option value="">{t('consultationRequests.selectStatus', 'Select status')}</option>
              <option value="pending">{t('consultationRequests.statuses.pending', 'Pending')}</option>
              <option value="confirmed">{t('consultationRequests.statuses.confirmed', 'Confirmed')}</option>
              <option value="cancelled">{t('consultationRequests.statuses.cancelled', 'Cancelled')}</option>
              <option value="rejected">{t('consultationRequests.statuses.rejected', 'Rejected')}</option>
              <option value="completed">{t('consultationRequests.statuses.completed', 'Completed')}</option>
            </select>
            <Button
              type="button"
              variant="ghost"
              className="!p-2 min-w-0"
              loading={updatingId === row.id}
              onClick={() => updateStatus(row)}
              title={t('consultationRequests.updateStatus', 'Update status')}
              aria-label={t('consultationRequests.updateStatus', 'Update status')}
            >
              <IconCheck />
            </Button>
            <Button
              type="button"
              variant="danger"
              className="!p-2 min-w-0"
              onClick={() => handleDelete(row)}
              title={t('common.delete')}
              aria-label={t('common.delete')}
            >
              <IconTrash />
            </Button>
          </div>
        )}
      />
    </div>
  );
}

