import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArticleService, CourseService } from '@/api';
import { DataTable, Button, Modal, Loading, IconView, IconEdit, IconTrash, IconCheck, IconX, IconPublish, IconUnpublish } from '@/components/ui';
import { useConfirm } from '@/utils/confirmDialog';
import { toast } from '@/utils/toast';
import { Input } from '@/components/ui/Input';

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
  }, [page, search, filterPublished, filterAccepted]);

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
  }, []);

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
    ArticleService.getForEdit(editing.id)
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
      .catch(() => {});
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
      toast.error('Please select a course.');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await ArticleService.update(editing.id, buildFormData());
        toast.success('Article updated');
      } else {
        await ArticleService.create(buildFormData());
        toast.success('Article created');
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
      toast.success('Article published');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUnpublish = async (row) => {
    try {
      await ArticleService.unpublish(row.id);
      toast.success('Article unpublished');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAccept = async (row) => {
    try {
      await ArticleService.accept(row.id);
      toast.success('Article accepted');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReject = async (row) => {
    const title = getTitle(row);
    const ok = await confirm({
      title: 'Reject and delete article',
      message: `Reject and permanently delete "${title}"? This cannot be undone.`,
      confirmLabel: 'Reject & Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await ArticleService.reject(row.id);
      await ArticleService.remove(row.id);
      toast.success('Article rejected and deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (row) => {
    const title = row.title ?? row.title_ar ?? row.title_en ?? row.searchable_title ?? row.translations?.ar?.title ?? row.translations?.en?.title ?? 'this';
    const ok = await confirm({
      title: 'Delete article',
      message: `Delete "${title}"?`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await ArticleService.remove(row.id);
      toast.success('Article deleted');
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
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">Articles</h1>
        <Button onClick={openCreate}>Add article</Button>
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterPublished}
          onChange={(e) => { setFilterPublished(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-sm"
        >
          <option value="">All (published)</option>
          <option value="1">Published</option>
          <option value="0">Draft</option>
        </select>
        <select
          value={filterAccepted}
          onChange={(e) => { setFilterAccepted(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-sm"
        >
          <option value="">All (accepted)</option>
          <option value="1">Accepted</option>
          <option value="0">Pending</option>
        </select>
      </div>
      <DataTable
        columns={[
          { key: 'title', header: 'Title', render: (r) => getTitle(r) || '—' },
          { key: 'course', header: 'Course', render: (r) => r.course?.name ?? '—' },
          { key: 'user', header: 'User', render: (r) => r.user?.name ?? '—' },
          { key: 'status', header: 'Status', render: (r) => getStatusBadge(r) },
        ]}
        data={data}
        meta={meta ?? undefined}
        onPageChange={(pageNum, linkUrl) => (linkUrl ? fetchByUrl(linkUrl) : setPage(pageNum))}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        emptyMessage="No articles yet"
        actions={(row) => (
          <div className="flex flex-wrap gap-1 justify-end">
            <Link to={`/articles/${row.id}`}>
              <Button variant="ghost" className="!p-2 min-w-0" title="View" aria-label="View">
                <IconView />
              </Button>
            </Link>
            {(row.is_published !== true && row.is_published !== 1) && (
              <Button variant="ghost" className="!p-2 min-w-0" title="Publish" aria-label="Publish" onClick={() => handlePublish(row)}>
                <IconPublish />
              </Button>
            )}
            {(row.is_published === true || row.is_published === 1) && (
              <Button variant="ghost" className="!p-2 min-w-0" title="Unpublish" aria-label="Unpublish" onClick={() => handleUnpublish(row)}>
                <IconUnpublish />
              </Button>
            )}
            {(row.accepted !== true && row.accepted !== 1) && (
              <>
                <Button variant="ghost" className="!p-2 min-w-0" title="Accept" aria-label="Accept" onClick={() => handleAccept(row)}>
                  <IconCheck />
                </Button>
                <Button variant="ghost" className="!p-2 min-w-0" title="Reject" aria-label="Reject" onClick={() => handleReject(row)}>
                  <IconX />
                </Button>
              </>
            )}
            <Button variant="ghost" className="!p-2 min-w-0" title="Edit" aria-label="Edit" onClick={() => openEdit(row)}>
              <IconEdit />
            </Button>
            <Button variant="danger" className="!p-2 min-w-0" title="Delete" aria-label="Delete" onClick={() => handleDelete(row)}>
              <IconTrash />
            </Button>
          </div>
        )}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit article' : 'Create article'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title (Arabic) *" value={formTitleAr} onChange={(e) => setFormTitleAr(e.target.value)} required />
          <Input label="Title (English) *" value={formTitleEn} onChange={(e) => setFormTitleEn(e.target.value)} required />
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">Content (Arabic)</label>
            <textarea
              value={formContentAr}
              onChange={(e) => setFormContentAr(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">Content (English)</label>
            <textarea
              value={formContentEn}
              onChange={(e) => setFormContentEn(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">Course *</label>
            <select
              value={formCourseId}
              onChange={(e) => setFormCourseId(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              required={!editing}
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name ?? c.title ?? `Course ${c.id}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">Image (optional)</label>
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
              label="Earning points"
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
              Published
            </label>
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
