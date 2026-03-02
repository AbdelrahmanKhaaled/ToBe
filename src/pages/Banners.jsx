import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BannerService } from '@/api';
import { DataTable, Button, Modal, Loading, IconView, IconEdit, IconTrash } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { useConfirm } from '@/utils/confirmDialog';
import { toast } from '@/utils/toast';

export function Banners() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formDescAr, setFormDescAr] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formButtonTextAr, setFormButtonTextAr] = useState('');
  const [formButtonTextEn, setFormButtonTextEn] = useState('');
  const [formButtonUrl, setFormButtonUrl] = useState('');
  const [formImage, setFormImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await BannerService.getAll({ search: search || undefined, page, per_page: 10 });
      setData(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast.error(err.message || 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchByUrl = useCallback(async (url) => {
    setLoading(true);
    try {
      const res = await BannerService.getPageByUrl(url);
      if (res) {
        setData(res.data);
        setMeta(res.meta);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load banners');
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
    const clearEdit = () =>
      setSearchParams((p) => {
        const next = new URLSearchParams(p);
        next.delete('edit');
        return next;
      });
    const row = data.find((r) => r.id == id || String(r.id) === String(id));
    if (row) {
      openEdit(row);
      clearEdit();
    } else {
      BannerService.getById(id)
        .then((res) => {
          const item = res?.banner ?? res?.data ?? res;
          if (item) openEdit(item);
          clearEdit();
        })
        .catch(() => clearEdit());
    }
  }, [editId, data, loading]);

  const openCreate = () => {
    setEditing(null);
    setFormNameAr('');
    setFormNameEn('');
    setFormDescAr('');
    setFormDescEn('');
    setFormButtonTextAr('');
    setFormButtonTextEn('');
    setFormButtonUrl('');
    setFormImage(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const trans = row.translations || {};
    const ar = trans.ar || row;
    const en = trans.en || row;
    setFormNameAr(row.name_ar ?? ar.name ?? row.name ?? '');
    setFormNameEn(row.name_en ?? en.name ?? row.name ?? '');
    setFormDescAr(row.description_ar ?? ar.description ?? row.description ?? '');
    setFormDescEn(row.description_en ?? en.description ?? row.description ?? '');
    setFormButtonTextAr(row.button_text_ar ?? ar.button_text ?? row.button_text ?? '');
    setFormButtonTextEn(row.button_text_en ?? en.button_text ?? row.button_text ?? '');
    setFormButtonUrl(row.button_url ?? row.url ?? '');
    setFormImage(null);
    setModalOpen(true);
  };

  const buildCreateFormData = () => {
    const fd = new FormData();
    fd.append('name_ar', formNameAr || formNameEn || '');
    fd.append('name_en', formNameEn || formNameAr || '');
    fd.append('description_ar', formDescAr ?? '');
    fd.append('description_en', formDescEn ?? '');
    fd.append('button_text_ar', formButtonTextAr ?? '');
    fd.append('button_text_en', formButtonTextEn ?? '');
    fd.append('button_url', formButtonUrl ?? '');
    if (formImage) fd.append('image', formImage);
    return fd;
  };

  const buildUpdateBody = () => ({
    name_ar: formNameAr || formNameEn || '',
    name_en: formNameEn || formNameAr || '',
    description_ar: formDescAr ?? '',
    description_en: formDescEn ?? '',
    button_text_ar: formButtonTextAr ?? '',
    button_text_en: formButtonTextEn ?? '',
    button_url: formButtonUrl ?? '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await BannerService.update(editing.id, buildUpdateBody());
        if (formImage) {
          await BannerService.updateImage(editing.id, formImage);
        }
        toast.success('Banner updated');
      } else {
        await BannerService.create(buildCreateFormData());
        toast.success('Banner created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save banner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    const name =
      row.name ??
      row.name_en ??
      row.name_ar ??
      row.translations?.ar?.name ??
      row.translations?.en?.name ??
      'this';
    const ok = await confirm({
      title: 'Delete banner',
      message: `Delete "${name}"?`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await BannerService.remove(row.id);
      toast.success('Banner deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete banner');
    }
  };

  const getDisplayName = (row) =>
    row.title ??
    row.name ??
    row.name_en ??
    row.name_ar ??
    row.translations?.ar?.name ??
    row.translations?.en?.name ??
    row.id;

  const getDisplayDesc = (row) =>
    row.description ??
    row.description_en ??
    row.description_ar ??
    row.translations?.ar?.description ??
    row.translations?.en?.description ??
    '';

  if (loading && !data.length) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">Banners</h1>
        <Button onClick={openCreate}>Add banner</Button>
      </div>
      <DataTable
        columns={[
          { key: 'title', header: 'Title', render: (r) => getDisplayName(r) },
          { key: 'description', header: 'Description', render: (r) => getDisplayDesc(r) },
          {
            key: 'button_text',
            header: 'Button text',
            render: (r) => r.button_text ?? r.button_text_en ?? r.button_text_ar ?? '',
          },
          { key: 'url', header: 'URL', render: (r) => r.button_url ?? '' },
        ]}
        data={data}
        meta={meta ?? undefined}
        onPageChange={(pageNum, linkUrl) => (linkUrl ? fetchByUrl(linkUrl) : setPage(pageNum))}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        emptyMessage="No banners yet"
        actions={(row) => (
          <div className="flex gap-1 justify-end">
            <Link to="#" aria-disabled="true">
              <Button variant="ghost" className="!p-2 min-w-0" title="View" aria-label="View" disabled>
                <IconView />
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="!p-2 min-w-0"
              title="Edit"
              aria-label="Edit"
              onClick={() => openEdit(row)}
            >
              <IconEdit />
            </Button>
            <Button
              variant="danger"
              className="!p-2 min-w-0"
              title="Delete"
              aria-label="Delete"
              onClick={() => handleDelete(row)}
            >
              <IconTrash />
            </Button>
          </div>
        )}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit banner' : 'Create banner'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name (Arabic) *"
            value={formNameAr}
            onChange={(e) => setFormNameAr(e.target.value)}
            required
          />
          <Input
            label="Name (English) *"
            value={formNameEn}
            onChange={(e) => setFormNameEn(e.target.value)}
            required
          />
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">Description (Arabic)</label>
            <textarea
              value={formDescAr}
              onChange={(e) => setFormDescAr(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">Description (English)</label>
            <textarea
              value={formDescEn}
              onChange={(e) => setFormDescEn(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={2}
            />
          </div>
          <Input
            label="Button text (Arabic)"
            value={formButtonTextAr}
            onChange={(e) => setFormButtonTextAr(e.target.value)}
          />
          <Input
            label="Button text (English)"
            value={formButtonTextEn}
            onChange={(e) => setFormButtonTextEn(e.target.value)}
          />
          <Input
            label="Button URL"
            value={formButtonUrl}
            onChange={(e) => setFormButtonUrl(e.target.value)}
            type="url"
          />
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormImage(e.target.files?.[0] ?? null)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-sm file:mr-2 file:rounded file:border-0 file:bg-[var(--color-accent)] file:px-3 file:py-1 file:text-white file:text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

