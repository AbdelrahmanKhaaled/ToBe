import { useCallback, useEffect, useState } from 'react';
import { TagService } from '@/api';
import { DataTable, Button, Modal, Loading, IconEdit, IconTrash } from '@/components/ui';
import { useConfirm } from '@/utils/confirmDialog';
import { toast } from '@/utils/toast';
import { Input } from '@/components/ui/Input';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';

function tagName(row) {
  const n = row?.name;
  if (n != null && typeof n === 'object') return String(n.ar ?? n.en ?? '');
  return String(n ?? '');
}

export function Tags() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formName, setFormName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const confirm = useConfirm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await TagService.getAll({
        search: search || undefined,
        page,
        per_page: 10,
      });
      setData(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, lang]);

  const fetchByUrl = useCallback(async (url) => {
    setLoading(true);
    try {
      const res = await TagService.getPageByUrl(url);
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

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setFormName(tagName(row));
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await TagService.update(editing.id, formName.trim());
        toast.success(t('tags.toasts.updated', 'Tag updated'));
      } else {
        const fd = new FormData();
        fd.append('name', formName.trim());
        await TagService.create(fd);
        toast.success(t('tags.toasts.created', 'Tag created'));
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    const ok = await confirm({
      title: t('tags.deleteTitle', 'Delete tag'),
      message: t('tags.deleteMessage', { name: tagName(row) || String(row.id) }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await TagService.remove(row.id);
      toast.success(t('tags.toasts.deleted', 'Tag deleted'));
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading && !data.length) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">{t('tags.title', 'Tags')}</h1>
        <Button onClick={openCreate}>{t('tags.add', 'Add tag')}</Button>
      </div>
      <DataTable
        columns={[
          { key: 'id', header: t('tags.columns.id', 'ID'), render: (r) => r.id },
          { key: 'name', header: t('tags.columns.name', 'Name'), render: (r) => tagName(r) || '—' },
        ]}
        data={data}
        meta={meta ?? undefined}
        onPageChange={(pageNum, linkUrl) => (linkUrl ? fetchByUrl(linkUrl) : setPage(pageNum))}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        emptyMessage={t('tags.empty', 'No tags yet')}
        actions={(row) => (
          <div className="flex gap-1 justify-end">
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
        title={editing ? t('tags.modalEdit', 'Edit tag') : t('tags.modalCreate', 'Create tag')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('tags.name', 'Name')}
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
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
