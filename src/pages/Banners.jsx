import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BannerService } from '@/api';
import { DataTable, Button, Modal, Loading, IconView, IconEdit, IconTrash } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { useConfirm } from '@/utils/confirmDialog';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';

export function Banners() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
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
  }, [page, search, lang]);

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
    // API list/show may return title/description/button_text as plain fields.
    // Keep Arabic/English inputs filled by falling back to these generic values.
    const fallbackTitle = row.title ?? row.name ?? '';
    const fallbackDescription = row.description ?? '';
    const fallbackButtonText = row.button_text ?? '';

    setFormNameAr(row.name_ar ?? ar.name ?? ar.title ?? fallbackTitle);
    setFormNameEn(row.name_en ?? en.name ?? en.title ?? fallbackTitle);
    setFormDescAr(row.description_ar ?? ar.description ?? fallbackDescription);
    setFormDescEn(row.description_en ?? en.description ?? fallbackDescription);
    setFormButtonTextAr(row.button_text_ar ?? ar.button_text ?? fallbackButtonText);
    setFormButtonTextEn(row.button_text_en ?? en.button_text ?? fallbackButtonText);
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
    // Backend may persist/display the banner title using either `name_*` or `title_*`.
    // We send both to ensure "Name/Title" updates reliably.
    name_ar: formNameAr || formNameEn || '',
    name_en: formNameEn || formNameAr || '',
    title_ar: formNameAr || formNameEn || '',
    title_en: formNameEn || formNameAr || '',
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
      title: t('bannersPage.deleteTitle'),
      message: t('bannersPage.deleteMessage', { name }),
      confirmLabel: t('common.delete'),
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
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">{t('bannersPage.title')}</h1>
        <Button onClick={openCreate}>{t('bannersPage.add')}</Button>
      </div>
      <DataTable
        columns={[
          { key: 'title', header: t('bannersPage.name'), render: (r) => getDisplayName(r) },
          { key: 'description', header: t('bannersPage.description'), render: (r) => getDisplayDesc(r) },
        ]}
        data={data}
        meta={meta ?? undefined}
        onPageChange={(pageNum, linkUrl) => (linkUrl ? fetchByUrl(linkUrl) : setPage(pageNum))}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        emptyMessage={t('bannersPage.empty')}
        actions={(row) => (
          <div className="flex gap-1 justify-end">
            <Link to={`/banners/${row.id}`}>
              <Button
                variant="ghost"
                className="!p-2 min-w-0"
                title={t('common.view')}
                aria-label={t('common.view')}
              >
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
        title={editing ? t('bannersPage.modalEdit') : t('bannersPage.modalCreate')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('bannersPage.nameAr')}
            value={formNameAr}
            onChange={(e) => setFormNameAr(e.target.value)}
            required
          />
          <Input
            label={t('bannersPage.nameEn')}
            value={formNameEn}
            onChange={(e) => setFormNameEn(e.target.value)}
            required
          />
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('bannersPage.descAr')}</label>
            <textarea
              value={formDescAr}
              onChange={(e) => setFormDescAr(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('bannersPage.descEn')}</label>
            <textarea
              value={formDescEn}
              onChange={(e) => setFormDescEn(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={2}
            />
          </div>
          <Input
            label={t('bannersPage.buttonTextAr')}
            value={formButtonTextAr}
            onChange={(e) => setFormButtonTextAr(e.target.value)}
          />
          <Input
            label={t('bannersPage.buttonTextEn')}
            value={formButtonTextEn}
            onChange={(e) => setFormButtonTextEn(e.target.value)}
          />
          <Input
            label={t('bannersPage.buttonUrl')}
            value={formButtonUrl}
            onChange={(e) => setFormButtonUrl(e.target.value)}
            type="url"
          />
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('bannersPage.image')}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormImage(e.target.files?.[0] ?? null)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-sm file:mr-2 file:rounded file:border-0 file:bg-[var(--color-accent)] file:px-3 file:py-1 file:text-white file:text-sm"
            />
          </div>
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

