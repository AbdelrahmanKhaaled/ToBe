import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CategoryService, SubCategoryService } from '@/api';
import { DataTable, Button, Modal, Loading, IconEdit, IconTrash, IconView } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { useConfirm } from '@/utils/confirmDialog';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';

export function SubCategories() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { lang } = useLanguage();

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
  const [searchParams, setSearchParams] = useSearchParams();

  const categoriesById = useMemo(() => {
    const m = new Map();
    for (const c of categories) m.set(String(c.id), c);
    return m;
  }, [categories]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await CategoryService.getAll({ page: 1, per_page: 200 });
      setCategories(Array.isArray(res?.data) ? res.data : []);
    } catch (_) {
      setCategories([]);
    }
  }, [lang]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SubCategoryService.getAll({ search: search || undefined, page, per_page: 10 });
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
      const res = await SubCategoryService.getPageByUrl(url);
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
      SubCategoryService.getById(id)
        .then((res) => {
          const item = res?.sub_category ?? res?.data ?? res;
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
    setFormCategoryId('');
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
    setFormCategoryId(String(row.category_id ?? row.category?.id ?? ''));
    setFormImage(null);
    setModalOpen(true);
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('name_ar', formNameAr || formNameEn || '');
    fd.append('name_en', formNameEn || formNameAr || '');
    fd.append('description_ar', formDescAr ?? '');
    fd.append('description_en', formDescEn ?? '');
    if (formCategoryId) fd.append('category_id', formCategoryId);
    if (formImage) fd.append('image', formImage);
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await SubCategoryService.update(editing.id, buildFormData());
        toast.success(t('subCategories.modalEdit'));
      } else {
        await SubCategoryService.create(buildFormData());
        toast.success(t('subCategories.modalCreate'));
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
    const name = row.name ?? row.translations?.ar?.name ?? row.translations?.en?.name ?? 'this';
    const ok = await confirm({
      title: t('subCategories.deleteTitle'),
      message: t('subCategories.deleteMessage', { name }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await SubCategoryService.remove(row.id);
      toast.success(t('subCategories.deleteTitle'));
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getDisplayName = (row) =>
    row.name ?? row.translations?.ar?.name ?? row.translations?.en?.name ?? row.id;

  const getDisplayDesc = (row) =>
    row.description ?? row.translations?.ar?.description ?? row.translations?.en?.description ?? '';

  const getCategoryName = (row) => {
    const id = row.category_id ?? row.category?.id ?? '';
    if (!id) return '-';
    const c = categoriesById.get(String(id));
    return c?.name ?? c?.translations?.ar?.name ?? c?.translations?.en?.name ?? id;
  };

  if (loading && !data.length) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">{t('subCategories.title')}</h1>
        <Button onClick={openCreate}>{t('subCategories.add')}</Button>
      </div>

      <DataTable
        columns={[
          { key: 'name', header: t('subCategories.name'), render: (r) => getDisplayName(r) },
          { key: 'category', header: t('subCategories.category'), render: (r) => getCategoryName(r) },
          { key: 'description', header: t('subCategories.description'), render: (r) => getDisplayDesc(r) },
        ]}
        data={data}
        meta={meta ?? undefined}
        onPageChange={(pageNum, linkUrl) => (linkUrl ? fetchByUrl(linkUrl) : setPage(pageNum))}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        emptyMessage={t('subCategories.empty')}
        actions={(row) => (
          <div className="flex gap-1 justify-end">
            <Link to={`/sub-categories/${row.id}`}>
              <Button variant="ghost" className="!p-2 min-w-0" title={t('common.view')} aria-label={t('common.view')}>
                <IconView />
              </Button>
            </Link>
            <Button variant="ghost" className="!p-2 min-w-0" title="Edit" aria-label="Edit" onClick={() => openEdit(row)}>
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
        title={editing ? t('subCategories.modalEdit') : t('subCategories.modalCreate')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('subCategories.nameAr')} value={formNameAr} onChange={(e) => setFormNameAr(e.target.value)} required />
          <Input label={t('subCategories.nameEn')} value={formNameEn} onChange={(e) => setFormNameEn(e.target.value)} required />

          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('subCategories.category')}</label>
            <select
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-white"
              required
            >
              <option value="">{t('subCategories.selectCategory')}</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name ?? c.translations?.ar?.name ?? c.translations?.en?.name ?? c.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('subCategories.descAr')}</label>
            <textarea
              value={formDescAr}
              onChange={(e) => setFormDescAr(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('subCategories.descEn')}</label>
            <textarea
              value={formDescEn}
              onChange={(e) => setFormDescEn(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('subCategories.image')}</label>
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

