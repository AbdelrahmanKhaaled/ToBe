import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MentorService } from '@/api';
import { DataTable, Button, Modal, Loading, IconView, IconEdit, IconTrash } from '@/components/ui';
import { useConfirm } from '@/utils/confirmDialog';
import { toast } from '@/utils/toast';
import { Input } from '@/components/ui/Input';
import { getStoredMentorPhone, setStoredMentorPhone } from '@/utils/mentorPhoneStorage';
import { useTranslation } from 'react-i18next';

export function Mentors() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  const normalizeMentorRow = (item) => (item && typeof item === 'object' && item.mentor != null ? { ...item.mentor, id: item.mentor.id ?? item.id } : item);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await MentorService.getAll({
        search: search || undefined,
        page,
        per_page: 10,
      });
      const list = Array.isArray(res.data) ? res.data.map(normalizeMentorRow) : res.data ?? [];
      setData(list);
      setMeta(res.meta);
      return list;
    } catch (err) {
      toast.error(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchByUrl = useCallback(async (url) => {
    setLoading(true);
    try {
      const res = await MentorService.getPageByUrl(url);
      if (res) {
        const list = Array.isArray(res.data) ? res.data.map(normalizeMentorRow) : res.data ?? [];
        setData(list);
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

  const editId = searchParams.get('edit');
  useEffect(() => {
    if (!editId || loading) return;
    const id = Number(editId) || editId;
    const clearEdit = () => setSearchParams((p) => { const next = new URLSearchParams(p); next.delete('edit'); return next; });
    const row = data.find((r) => r.id == id || String(r.id) === String(id));
    if (row) {
      openEdit(row);
      clearEdit();
    } else {
      MentorService.getById(id)
        .then((res) => {
          const item = res?.mentor ?? res?.data ?? res;
          if (item) openEdit(item);
          clearEdit();
        })
        .catch(() => clearEdit());
    }
  }, [editId, data, loading]);

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setFieldErrors({});
    setModalOpen(true);
  };

  const getMentorPhone = (row) => {
    if (!row) return '';
    const m = row.mentor ?? row;
    const fromApi =
      m.phone_number ??
      m.phone ??
      row.phone_number ??
      row.phone ??
      m.mobile ??
      m.tel ??
      m.contact_number ??
      m.user?.phone_number ??
      m.user?.phone ??
      m.profile?.phone_number ??
      m.profile?.phone ??
      '';
    if (fromApi) return fromApi;
    const id = row.id ?? m.id;
    if (id != null) return getStoredMentorPhone(id);
    return '';
  };

  const openEdit = (row) => {
    if (!row) return;
    setEditing(row);
    setFieldErrors({});
    setFormName(row.name ?? row.name_ar ?? row.name_en ?? '');
    setFormEmail(row.email ?? '');
    setFormPhone(getMentorPhone(row));
    setFormPassword('');
    setModalOpen(true);
  };

  useEffect(() => {
    if (editing && modalOpen) {
      setFormName(editing.name ?? editing.name_ar ?? editing.name_en ?? '');
      setFormEmail(editing.email ?? '');
      setFormPhone(getMentorPhone(editing));
    }
  }, [editing?.id, modalOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    try {
      if (editing) {
        const originalEmail = editing.email ?? '';
        const params = { name: formName, phone_number: formPhone };
        if (formEmail !== originalEmail) params.email = formEmail;
        if (formPassword) params.password = formPassword;
        await MentorService.update(editing.id, params);
        toast.success('Mentor updated');
        setStoredMentorPhone(editing.id, formPhone);
        setData((prev) =>
          prev.map((r) =>
            r.id === editing.id
              ? { ...r, phone: formPhone, phone_number: formPhone, name: formName, ...(formEmail !== (editing.email ?? '') && { email: formEmail }) }
              : r
          )
        );
        setEditing((prev) => (prev && prev.id === editing.id ? { ...prev, phone: formPhone, phone_number: formPhone, name: formName, ...(formEmail !== (editing.email ?? '') && { email: formEmail }) } : prev));
      } else {
        const fd = new FormData();
        fd.append('name', formName);
        fd.append('email', formEmail);
        fd.append('phone', formPhone);
        fd.append('password', formPassword);
        const created = await MentorService.create(fd);
        toast.success('Mentor created');
        setModalOpen(false);
        const createdId = created?.id ?? created?.data?.id ?? created?.mentor?.id;
        const list = await fetchData();
        if (createdId != null && formPhone) {
          setStoredMentorPhone(createdId, formPhone);
          if (Array.isArray(list)) {
            setData(
              list.map((r) => (r.id == createdId ? { ...r, phone: formPhone, phone_number: formPhone } : r))
            );
          }
        }
        return;
      }
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      const errors = err?.data?.errors ?? err?.errors ?? {};
      setFieldErrors(typeof errors === 'object' ? errors : {});
      const message = err?.data?.message ?? err?.message ?? 'Request failed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    const ok = await confirm({
      title: t('mentors.deleteTitle'),
      message: t('mentors.deleteMessage', { name: row.name }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await MentorService.remove(row.id);
      toast.success('Mentor deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading && !data.length) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">{t('mentors.title')}</h1>
        <Button onClick={openCreate}>{t('mentors.add')}</Button>
      </div>
      <DataTable
        columns={[
          { key: 'name', header: t('mentors.name'), render: (row) => row.name ?? row.name_ar ?? row.name_en ?? '—' },
          { key: 'email', header: t('mentors.email') },
          { key: 'phone', header: t('mentors.phone'), render: (row) => getMentorPhone(row) || '—' },
        ]}
        data={data}
        meta={meta ?? undefined}
        onPageChange={(pageNum, linkUrl) => (linkUrl ? fetchByUrl(linkUrl) : setPage(pageNum))}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        emptyMessage={t('mentors.empty')}
        actions={(row) => (
          <div className="flex gap-1 justify-end">
            <Link to={`/mentors/${row.id}`}>
              <Button variant="ghost" className="!p-2 min-w-0" title={t('common.view')} aria-label={t('common.view')}>
                <IconView />
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="!p-2 min-w-0"
              title={t('common.edit')}
              aria-label={t('common.edit')}
              onClick={() => openEdit(row)}
            >
              <IconEdit />
            </Button>
            <Button
              variant="danger"
              className="!p-2 min-w-0"
              title={t('common.delete')}
              aria-label={t('common.delete')}
              onClick={() => handleDelete(row)}
            >
              <IconTrash />
            </Button>
          </div>
        )}
      />
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('mentors.modalEdit') : t('mentors.modalCreate')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('mentors.name')}
            value={formName}
            onChange={(e) => { setFormName(e.target.value); setFieldErrors((prev) => ({ ...prev, name: undefined })); }}
            error={fieldErrors.name?.[0] || fieldErrors.name}
            required
          />
          <Input
            label={t('mentors.email')}
            type="email"
            value={formEmail}
            onChange={(e) => { setFormEmail(e.target.value); setFieldErrors((prev) => ({ ...prev, email: undefined })); }}
            error={fieldErrors.email?.[0] || fieldErrors.email}
            required
          />
          <Input
            label={t('mentors.phone')}
            value={formPhone}
            onChange={(e) => { setFormPhone(e.target.value); setFieldErrors((prev) => ({ ...prev, phone: undefined, phone_number: undefined })); }}
            error={fieldErrors.phone?.[0] || fieldErrors.phone || fieldErrors.phone_number?.[0] || fieldErrors.phone_number}
          />
          <Input
            label={editing ? t('mentors.newPassword') : t('mentors.password')}
            type="password"
            value={formPassword}
            onChange={(e) => setFormPassword(e.target.value)}
            required={!editing}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={submitting}>
              {editing ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
