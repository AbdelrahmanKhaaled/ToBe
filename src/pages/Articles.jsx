import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArticleService, CourseService } from '@/api';
import { DataTable, Button, Modal, Loading, IconView, IconEdit, IconTrash, IconCheck, IconX, IconPublish, IconUnpublish } from '@/components/ui';
import { useConfirm } from '@/utils/confirmDialog';
import { toast } from '@/utils/toast';
import { Input } from '@/components/ui/Input';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { fetchBilingualEdit } from '@/utils/bilingualEdit';

function toFormValue(val) {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    const v = val.title ?? val.name ?? val.content ?? val.excerpt ?? val.description;
    return v != null ? String(v) : '';
  }
  return String(val);
}

export function Articles() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formTitleAr, setFormTitleAr] = useState('');
  const [formTitleEn, setFormTitleEn] = useState('');
  const [formContentAr, setFormContentAr] = useState('');
  const [formContentEn, setFormContentEn] = useState('');
  const [formCourseId, setFormCourseId] = useState('');
  const [formImage, setFormImage] = useState(null);
  const [formEarningPoints, setFormEarningPoints] = useState('0');
  const [formIsPublished, setFormIsPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const confirm = useConfirm();

  const [filterPublished, setFilterPublished] = useState('');
  const [filterAccepted, setFilterAccepted] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ArticleService.getAll({
        search: search || undefined,
        page,
        per_page: 10,
        is_published: filterPublished === '' ? undefined : filterPublished,
        accepted: filterAccepted === '' ? undefined : filterAccepted,
      });
      setData(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterPublished, filterAccepted, lang]);

  const fetchByUrl = useCallback(async (url) => {
    setLoading(true);
    try {
      const res = await ArticleService.getPageByUrl(url);
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

  const fetchCourses = useCallback(async () => {
    try {
      const res = await CourseService.getAll({ per_page: 200 });
      setCourses(res.data || []);
    } catch {
      setCourses([]);
    }
  }, [lang]);

  useEffect(() => {
    if (modalOpen) fetchCourses();
  }, [modalOpen, fetchCourses]);

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
      ArticleService.getForEdit(id)
        .then((res) => {
          const item = res?.article ?? res?.data ?? res ?? { id };
          if (item) openEdit(item);
          clearEdit();
        })
        .catch(() => clearEdit());
    }
  }, [editId, data, loading]);

  const openCreate = () => {
    setEditing(null);
    setFormTitleAr('');
    setFormTitleEn('');
    setFormContentAr('');
    setFormContentEn('');
    setFormCourseId('');
    setFormImage(null);
    setFormEarningPoints('0');
    setFormIsPublished(false);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const trans = row.translations || {};
    const ar = trans.ar || row;
    const en = trans.en || row;
    const titleObj = row.title && typeof row.title === 'object' ? row.title : null;
    const contentObj = row.content && typeof row.content === 'object' ? row.content : null;
    setFormTitleAr(toFormValue(row.title_ar ?? titleObj?.ar ?? ar?.title ?? row?.title));
    setFormTitleEn(toFormValue(row.title_en ?? titleObj?.en ?? en?.title ?? row?.title));
    setFormContentAr(toFormValue(contentObj?.ar ?? row.content_ar ?? ar?.content ?? row?.content));
    setFormContentEn(toFormValue(contentObj?.en ?? row.content_en ?? en?.content ?? row?.content));
    setFormCourseId(row.course_id != null ? String(row.course_id) : row.course?.id != null ? String(row.course.id) : '');
    setFormImage(null);
    setFormEarningPoints(row.earning_points != null ? String(row.earning_points) : '0');
    setFormIsPublished(row.is_published === true || row.is_published === 1);
    setModalOpen(true);
  };

  useEffect(() => {
    if (!editing?.id || !modalOpen) return;
    let cancelled = false;
    setEditLoading(true);
    fetchBilingualEdit({
      getForEdit: ArticleService.getForEdit.bind(ArticleService),
      id: editing.id,
      extractKeys: ['article', 'data'],
      bilingualFields: ['title', 'content'],
    })
      .then((data) => {
        if (cancelled || !data) return;
        // Edit API returns { article: { title: { ar, en }, content: { ar, en }, course_id, ... } }
        const d = data;
        const titleObj = d.title && typeof d.title === 'object' ? d.title : null;
        const contentObj = d.content && typeof d.content === 'object' ? d.content : {};
        const trans = d.translations || {};
        const ar = trans.ar || {};
        const en = trans.en || {};
        setFormTitleAr(toFormValue(d.title_ar ?? titleObj?.ar ?? ar?.title ?? d.title ?? d.searchable_title));
        setFormTitleEn(toFormValue(d.title_en ?? titleObj?.en ?? en?.title ?? d.title ?? d.searchable_title));
        setFormContentAr(toFormValue(contentObj.ar ?? d.content_ar ?? ar?.content));
        setFormContentEn(toFormValue(contentObj.en ?? d.content_en ?? en?.content));
        setFormCourseId(d.course_id != null ? String(d.course_id) : d.course?.id != null ? String(d.course.id) : '');
        setFormEarningPoints(d.earning_points != null ? String(d.earning_points) : '0');
        setFormIsPublished(d.is_published === true || d.is_published === 1);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setEditLoading(false);
      });
    return () => { cancelled = true; };
  }, [editing?.id, modalOpen]);

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('title_ar', formTitleAr || formTitleEn || '');
    fd.append('title_en', formTitleEn || formTitleAr || '');
    fd.append('content_ar', formContentAr ?? '');
    fd.append('content_en', formContentEn ?? '');
    fd.append('course_id', formCourseId || '');
    if (formImage) fd.append('image', formImage);
    fd.append('earning_points', formEarningPoints || '0');
    fd.append('is_published', formIsPublished ? '1' : '0');
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editing && !formCourseId) {
      toast.error(t('common.pleaseSelectCourse'));
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await ArticleService.update(editing.id, buildFormData());
        toast.success(t('articles.toasts.updated', 'Article updated'));
      } else {
        await ArticleService.create(buildFormData());
        toast.success(t('articles.toasts.created', 'Article created'));
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (row) => {
    try {
      await ArticleService.publish(row.id);
      toast.success(t('articles.toasts.published', 'Article published'));
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUnpublish = async (row) => {
    try {
      await ArticleService.unpublish(row.id);
      toast.success(t('articles.toasts.unpublished', 'Article unpublished'));
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAccept = async (row) => {
    try {
      await ArticleService.accept(row.id);
      toast.success(t('articles.toasts.accepted', 'Article accepted'));
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReject = async (row) => {
    const title = getTitle(row);
    const ok = await confirm({
      title: t('articles.rejectDeleteTitle'),
      message: t('articles.rejectDeleteMessage', { title }),
      confirmLabel: t('courses.reject', 'Reject'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await ArticleService.reject(row.id);
      await ArticleService.remove(row.id);
      toast.success(t('articles.toasts.rejectedDeleted', 'Article rejected and deleted'));
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (row) => {
    const title = row.title ?? row.title_ar ?? row.title_en ?? row.searchable_title ?? row.translations?.ar?.title ?? row.translations?.en?.title ?? 'this';
    const ok = await confirm({
      title: t('articles.deleteTitle'),
      message: t('articles.deleteMessage', { title }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await ArticleService.remove(row.id);
      toast.success(t('articles.toasts.deleted', 'Article deleted'));
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getTitle = (row) => {
    const t = row.title;
    if (t != null && typeof t === 'object') return t.ar ?? t.en ?? row.searchable_title ?? row.id;
    return t ?? row.title_ar ?? row.title_en ?? row.searchable_title ?? row.translations?.ar?.title ?? row.translations?.en?.title ?? row.id;
  };

  const getExcerpt = (row) =>
    row.excerpt ?? row.translations?.ar?.excerpt ?? row.translations?.en?.excerpt ?? '';

  const getStatusBadge = (row) => {
    const pub = row.is_published;
    const acc = row.accepted;
    const parts = [];
    if (pub === true || pub === 1) parts.push(<span key="p" className="text-green-600 text-xs font-medium">Published</span>);
    else parts.push(<span key="p" className="text-gray-500 text-xs">Draft</span>);
    if (acc === true || acc === 1) parts.push(<span key="a" className="text-green-600 text-xs font-medium ml-2">Accepted</span>);
    else if (acc === false || acc === 0) parts.push(<span key="a" className="text-amber-600 text-xs ml-2">Pending</span>);
    return <span className="flex items-center gap-1">{parts}</span>;
  };

  if (loading && !data.length) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">{t('articles.title')}</h1>
        <Button onClick={openCreate}>{t('articles.add')}</Button>
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterPublished}
          onChange={(e) => { setFilterPublished(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-sm"
        >
          <option value="">{t('articles.filters.allPublished')}</option>
          <option value="1">{t('articles.filters.published')}</option>
          <option value="0">{t('articles.filters.draft')}</option>
        </select>
        <select
          value={filterAccepted}
          onChange={(e) => { setFilterAccepted(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-sm"
        >
          <option value="">{t('articles.filters.allAccepted')}</option>
          <option value="1">{t('articles.filters.accepted')}</option>
          <option value="0">{t('articles.filters.pending')}</option>
        </select>
      </div>
      <DataTable
        columns={[
          { key: 'title', header: t('articles.columns.title'), render: (r) => getTitle(r) || '—' },
          { key: 'course', header: t('articles.columns.course'), render: (r) => r.course?.name ?? '—' },
          { key: 'user', header: t('articles.columns.user'), render: (r) => r.user?.name ?? '—' },
          { key: 'status', header: t('articles.columns.status'), render: (r) => getStatusBadge(r) },
        ]}
        data={data}
        meta={meta ?? undefined}
        onPageChange={(pageNum, linkUrl) => (linkUrl ? fetchByUrl(linkUrl) : setPage(pageNum))}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        emptyMessage={t('articles.empty')}
        actions={(row) => (
          <div className="flex flex-wrap gap-1 justify-end">
            <Link to={`/articles/${row.id}`}>
              <Button
                variant="ghost"
                className="!p-2 min-w-0"
                title={t('common.view')}
                aria-label={t('common.view')}
              >
                <IconView />
              </Button>
            </Link>
            {(row.is_published !== true && row.is_published !== 1) && (
              <Button
                variant="ghost"
                className="!p-2 min-w-0"
                title={t('articles.publish')}
                aria-label={t('articles.publish')}
                onClick={() => handlePublish(row)}
              >
                <IconPublish />
              </Button>
            )}
            {(row.is_published === true || row.is_published === 1) && (
              <Button
                variant="ghost"
                className="!p-2 min-w-0"
                title={t('articles.unpublish')}
                aria-label={t('articles.unpublish')}
                onClick={() => handleUnpublish(row)}
              >
                <IconUnpublish />
              </Button>
            )}
            {(row.accepted !== true && row.accepted !== 1) && (
              <>
                <Button
                  variant="ghost"
                  className="!p-2 min-w-0"
                  title={t('courses.accept', 'Accept')}
                  aria-label={t('courses.accept', 'Accept')}
                  onClick={() => handleAccept(row)}
                >
                  <IconCheck />
                </Button>
                <Button
                  variant="ghost"
                  className="!p-2 min-w-0"
                  title={t('courses.reject', 'Reject')}
                  aria-label={t('courses.reject', 'Reject')}
                  onClick={() => handleReject(row)}
                >
                  <IconX />
                </Button>
              </>
            )}
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
        title={editing ? t('articles.modalEdit') : t('articles.modalCreate')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {editLoading && <div className="text-sm text-gray-500">Loading full article details…</div>}
          <Input
            label={t('articles.titleAr')}
            value={formTitleAr}
            onChange={(e) => setFormTitleAr(e.target.value)}
            required
          />
          <Input
            label={t('articles.titleEn')}
            value={formTitleEn}
            onChange={(e) => setFormTitleEn(e.target.value)}
            required
          />
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">
              {t('articles.contentAr')}
            </label>
            <textarea
              value={formContentAr}
              onChange={(e) => setFormContentAr(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">
              {t('articles.contentEn')}
            </label>
            <textarea
              value={formContentEn}
              onChange={(e) => setFormContentEn(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">
              {t('articles.course')}
            </label>
            <select
              value={formCourseId}
              onChange={(e) => setFormCourseId(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              required={!editing}
            >
              <option value="">{t('articles.selectCourse')}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name ?? c.title ?? `Course ${c.id}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">
              {t('articles.image')}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormImage(e.target.files?.[0] ?? null)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-sm file:mr-2 file:rounded file:border-0 file:bg-[var(--color-accent)] file:px-3 file:py-1 file:text-white file:text-sm"
            />
          </div>
          <div>
            <Input
              type="number"
              min="0"
              label={t('articles.earningPoints')}
              value={formEarningPoints}
              onChange={(e) => setFormEarningPoints(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="form-is-published"
              checked={formIsPublished}
              onChange={(e) => setFormIsPublished(e.target.checked)}
              className="rounded border-[var(--color-border)]"
            />
            <label htmlFor="form-is-published" className="text-sm font-medium text-[var(--color-primary)]">
              {t('articles.publishedFlag')}
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={submitting} disabled={editLoading}>
              {editing ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
