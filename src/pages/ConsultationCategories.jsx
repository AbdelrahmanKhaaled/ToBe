import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConsultationCategoryService } from '@/api';
import { DataTable, Button, Modal, Loading, IconEdit, IconTrash, IconView } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { useConfirm } from '@/utils/confirmDialog';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';
import { getCurrentLanguage } from '@/utils/language';
import { useLanguage } from '@/context/LanguageContext';
import { fetchBilingualEdit } from '@/utils/bilingualEdit';

export function ConsultationCategories() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { lang } = useLanguage();

  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formDescAr, setFormDescAr] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formTypeSlug, setFormTypeSlug] = useState('');
  const [formImage, setFormImage] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ConsultationCategoryService.getAll({ search: search || undefined, page, per_page: 10 });
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
      const res = await ConsultationCategoryService.getPageByUrl(url);
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
    setFormNameAr('');
    setFormNameEn('');
    setFormDescAr('');
    setFormDescEn('');
    setFormSlug('');
    setFormTypeSlug('');
    setFormImage(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const trans = row.translations || {};
    const ar = trans.ar || row;
    const en = trans.en || row;
    const nameObj = row.name && typeof row.name === 'object' ? row.name : null;
    const descObj = row.description && typeof row.description === 'object' ? row.description : null;
    setFormNameAr(row.name_ar ?? nameObj?.ar ?? ar.name ?? row.name ?? '');
    setFormNameEn(row.name_en ?? nameObj?.en ?? en.name ?? row.name ?? '');
    setFormDescAr(row.description_ar ?? descObj?.ar ?? ar.description ?? row.description ?? '');
    setFormDescEn(row.description_en ?? descObj?.en ?? en.description ?? row.description ?? '');
    setFormSlug(row.slug ?? '');
    setFormTypeSlug(row.type_slug ?? '');
    setFormImage(null);
    setModalOpen(true);
  };

  const openEditById = useCallback(async (id) => {
    const categoryId = id != null ? String(id) : id;
    if (categoryId == null || categoryId === '') return;
    setEditLoading(true);
    try {
      const merged = await fetchBilingualEdit({
        getForEdit: ConsultationCategoryService.getForEdit.bind(ConsultationCategoryService),
        id: categoryId,
        extractKeys: ['category', 'data'],
        bilingualFields: ['name', 'description'],
      });
      if (merged) openEdit(merged);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEditLoading(false);
    }
  }, []);

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('name_ar', formNameAr || formNameEn || '');
    fd.append('name_en', formNameEn || formNameAr || '');
    fd.append('description_ar', formDescAr ?? '');
    fd.append('description_en', formDescEn ?? '');
    if (formTypeSlug) fd.append('type_slug', formTypeSlug);
    if (formSlug) fd.append('slug', formSlug);
    if (formImage) fd.append('image', formImage);
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await ConsultationCategoryService.update(editing.id, buildFormData());
        toast.success(t('consultationCategories.modalEdit'));
      } else {
        await ConsultationCategoryService.create(buildFormData());
        toast.success(t('consultationCategories.modalCreate'));
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
    const lang = getCurrentLanguage();
    const name =
      (row.name && typeof row.name === 'object' ? (row.name?.[lang] ?? row.name?.en ?? row.name?.ar) : row.name) ??
      row.translations?.ar?.name ??
      row.translations?.en?.name ??
      'this';
    const ok = await confirm({
      title: t('consultationCategories.deleteTitle'),
      message: t('consultationCategories.deleteMessage', { name }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await ConsultationCategoryService.remove(row.id);
      toast.success(t('consultationCategories.deleteTitle'));
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getDisplayName = (row) => {
    const lang = getCurrentLanguage();
    if (row?.name && typeof row.name === 'object') {
      return row.name?.[lang] ?? row.name?.en ?? row.name?.ar ?? row.id;
    }
    return row.name ?? row.translations?.ar?.name ?? row.translations?.en?.name ?? row.id;
  };

  const getDisplayDesc = (row) => {
    const lang = getCurrentLanguage();
    if (row?.description && typeof row.description === 'object') {
      return row.description?.[lang] ?? row.description?.en ?? row.description?.ar ?? '';
    }
    return row.description ?? row.translations?.ar?.description ?? row.translations?.en?.description ?? '';
  };

  if (loading && !data.length) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">{t('consultationCategories.title')}</h1>
        <Button onClick={openCreate}>{t('consultationCategories.add')}</Button>
      </div>

      <DataTable
        columns={[
          { key: 'name', header: t('consultationCategories.name'), render: (r) => getDisplayName(r) },
          { key: 'slug', header: t('consultationCategories.slug'), render: (r) => r.slug ?? '-' },
          { key: 'type_slug', header: t('consultationCategories.typeSlug'), render: (r) => r.type_slug ?? '-' },
          { key: 'description', header: t('consultationCategories.description'), render: (r) => getDisplayDesc(r) },
        ]}
        data={data}
        meta={meta ?? undefined}
        onPageChange={(pageNum, linkUrl) => (linkUrl ? fetchByUrl(linkUrl) : setPage(pageNum))}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        emptyMessage={t('consultationCategories.empty')}
        actions={(row) => (
          <div className="flex gap-1 justify-end">
            <Link to={`/consultation-categories/${row.id}`}>
              <Button variant="ghost" className="!p-2 min-w-0" title={t('common.view')} aria-label={t('common.view')}>
                <IconView />
              </Button>
            </Link>
            <Button variant="ghost" className="!p-2 min-w-0" title="Edit" aria-label="Edit" onClick={() => openEditById(row.id)}>
              <IconEdit />
            </Button>
            <Button variant="danger" className="!p-2 min-w-0" title="Delete" aria-label="Delete" onClick={() => handleDelete(row)}>
              <IconTrash />
            </Button>
          </div>
        )}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('consultationCategories.modalEdit') : t('consultationCategories.modalCreate')}
      >
        {editLoading ? (
          <Loading />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('consultationCategories.nameAr')}
            value={formNameAr}
            onChange={(e) => setFormNameAr(e.target.value)}
            required
          />
          <Input
            label={t('consultationCategories.nameEn')}
            value={formNameEn}
            onChange={(e) => setFormNameEn(e.target.value)}
            required
          />
          <Input label={t('consultationCategories.slug')} value={formSlug} onChange={(e) => setFormSlug(e.target.value)} />
          <Input
            label={t('consultationCategories.typeSlug')}
            value={formTypeSlug}
            onChange={(e) => setFormTypeSlug(e.target.value)}
          />

          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('consultationCategories.descAr')}</label>
            <textarea
              value={formDescAr}
              onChange={(e) => setFormDescAr(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('consultationCategories.descEn')}</label>
            <textarea
              value={formDescEn}
              onChange={(e) => setFormDescEn(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('consultationCategories.image')}</label>
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
        )}
      </Modal>
    </div>
  );
}

