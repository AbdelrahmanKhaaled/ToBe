import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ConsultationCategoryService, ConsultationSubCategoryService } from '@/api';
import { DataTable, Button, Modal, Loading, IconEdit, IconTrash, IconView } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { useConfirm } from '@/utils/confirmDialog';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';
import { getCurrentLanguage } from '@/utils/language';
import { useLanguage } from '@/context/LanguageContext';
import { fetchBilingualEdit } from '@/utils/bilingualEdit';

export function ConsultationSubCategories() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { lang } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formDescAr, setFormDescAr] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formImage, setFormImage] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const categoriesById = useMemo(() => {
    const m = new Map();
    for (const c of categories) m.set(String(c.id), c);
    return m;
  }, [categories]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await ConsultationCategoryService.getAll({ page: 1, per_page: 200 });
      setCategories(Array.isArray(res?.data) ? res.data : []);
    } catch (_) {
      setCategories([]);
    }
  }, [lang]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ConsultationSubCategoryService.getAll({ search: search || undefined, page, per_page: 10 });
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
      const res = await ConsultationSubCategoryService.getPageByUrl(url);
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
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setFormNameAr('');
    setFormNameEn('');
    setFormDescAr('');
    setFormDescEn('');
    setFormCategoryId('');
    setFormImage(null);
    setModalOpen(true);
  };

  const openEdit = useCallback((row) => {
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
    setFormCategoryId(String(row.consultation_category_id ?? row.consultation_category?.id ?? ''));
    setFormImage(null);
    setModalOpen(true);
  }, []);

  const openEditById = useCallback(async (id) => {
    const subCategoryId = id != null ? String(id) : id;
    if (subCategoryId == null || subCategoryId === '') return;
    setEditLoading(true);
    try {
      const merged = await fetchBilingualEdit({
        getForEdit: ConsultationSubCategoryService.getForEdit.bind(ConsultationSubCategoryService),
        id: subCategoryId,
        extractKeys: ['sub_category', 'data'],
        bilingualFields: ['name', 'description'],
      });
      if (merged) openEdit(merged);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEditLoading(false);
    }
  }, [openEdit]);

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
    openEditById(id).finally(() => clearEdit());
  }, [editId, loading, openEditById, setSearchParams]);

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('name_ar', formNameAr || formNameEn || '');
    fd.append('name_en', formNameEn || formNameAr || '');
    fd.append('description_ar', formDescAr ?? '');
    fd.append('description_en', formDescEn ?? '');
    if (formCategoryId) fd.append('consultation_category_id', formCategoryId);
    if (formImage) fd.append('image', formImage);
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await ConsultationSubCategoryService.update(editing.id, buildFormData());
        toast.success(t('consultationSubCategories.modalEdit'));
      } else {
        await ConsultationSubCategoryService.create(buildFormData());
        toast.success(t('consultationSubCategories.modalCreate'));
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
      title: t('consultationSubCategories.deleteTitle'),
      message: t('consultationSubCategories.deleteMessage', { name }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await ConsultationSubCategoryService.remove(row.id);
      toast.success(t('consultationSubCategories.deleteTitle'));
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

  const getCategoryName = (row) => {
    const lang = getCurrentLanguage();
    const id = row.consultation_category_id ?? row.consultation_category?.id ?? '';
    if (!id) return '-';
    const c = categoriesById.get(String(id));
    if (c?.name && typeof c.name === 'object') {
      return c.name?.[lang] ?? c.name?.en ?? c.name?.ar ?? id;
    }
    return c?.name ?? c?.translations?.ar?.name ?? c?.translations?.en?.name ?? id;
  };

  if (loading && !data.length) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">{t('consultationSubCategories.title')}</h1>
        <Button onClick={openCreate}>{t('consultationSubCategories.add')}</Button>
      </div>

      <DataTable
        columns={[
          { key: 'name', header: t('consultationSubCategories.name'), render: (r) => getDisplayName(r) },
          { key: 'category', header: t('consultationSubCategories.category'), render: (r) => getCategoryName(r) },
          { key: 'description', header: t('consultationSubCategories.description'), render: (r) => getDisplayDesc(r) },
        ]}
        data={data}
        meta={meta ?? undefined}
        onPageChange={(pageNum, linkUrl) => (linkUrl ? fetchByUrl(linkUrl) : setPage(pageNum))}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        emptyMessage={t('consultationSubCategories.empty')}
        actions={(row) => (
          <div className="flex gap-1 justify-end">
            <Link to={`/consultation-sub-categories/${row.id}`}>
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
        title={editing ? t('consultationSubCategories.modalEdit') : t('consultationSubCategories.modalCreate')}
      >
        {editLoading ? (
          <Loading />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('consultationSubCategories.nameAr')} value={formNameAr} onChange={(e) => setFormNameAr(e.target.value)} required />
          <Input label={t('consultationSubCategories.nameEn')} value={formNameEn} onChange={(e) => setFormNameEn(e.target.value)} required />

          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('consultationSubCategories.category')}</label>
            <select
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-white"
              required
            >
              <option value="">{t('consultationSubCategories.selectCategory')}</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c?.name && typeof c.name === 'object'
                    ? (c.name?.[getCurrentLanguage()] ?? c.name?.en ?? c.name?.ar ?? c.id)
                    : (c.name ?? c.translations?.ar?.name ?? c.translations?.en?.name ?? c.id)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('consultationSubCategories.descAr')}</label>
            <textarea
              value={formDescAr}
              onChange={(e) => setFormDescAr(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('consultationSubCategories.descEn')}</label>
            <textarea
              value={formDescEn}
              onChange={(e) => setFormDescEn(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('consultationSubCategories.image')}</label>
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

