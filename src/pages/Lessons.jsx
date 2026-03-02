import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LessonService, CourseService } from '@/api';
import { DataTable, Button, Modal, Loading, IconView, IconEdit, IconTrash } from '@/components/ui';
import { useConfirm } from '@/utils/confirmDialog';
import { toast } from '@/utils/toast';
import { Input } from '@/components/ui/Input';
import { useTranslation } from 'react-i18next';
import { LessonVideoUploader } from '@/components/VideoChunkUploader';

function toFormValue(val) {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    const v = val.title ?? val.name ?? val.content ?? val.description ?? val.ar ?? val.en;
    return v != null ? String(v) : '';
  }
  return String(val);
}

function getCourseDisplayName(c) {
  if (!c) return '—';
  const n = c.name ?? c.title;
  if (typeof n === 'string') return n;
  if (n && typeof n === 'object') return n.en ?? n.ar ?? String(c.id ?? '');
  return String(c.id ?? '');
}

function getCourseName(courseOrId, coursesList = []) {
  if (!courseOrId) return '—';
  if (typeof courseOrId === 'object') return getCourseDisplayName(courseOrId);
  const c = coursesList.find((x) => x.id == courseOrId || String(x.id) === String(courseOrId));
  return c ? getCourseDisplayName(c) : String(courseOrId ?? '—');
}

function isCourseRecorded(c) {
  return c?.type === 'recorded';
}

export function Lessons() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formTitleAr, setFormTitleAr] = useState('');
  const [formTitleEn, setFormTitleEn] = useState('');
  const [formContentAr, setFormContentAr] = useState('');
  const [formContentEn, setFormContentEn] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formCourseId, setFormCourseId] = useState('');
  const [formOrder, setFormOrder] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await LessonService.getAll({
        search: search || undefined,
        course_id: courseId || undefined,
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
  }, [page, search, courseId]);

  const fetchByUrl = useCallback(async (url) => {
    setLoading(true);
    try {
      const res = await LessonService.getPageByUrl(url);
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

  useEffect(() => {
    let cancelled = false;
    CourseService.getAll({ per_page: 500 })
      .then((r) => {
        if (!cancelled) setCourses(Array.isArray(r.data) ? r.data : []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

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
      LessonService.getForEdit(id)
        .then((res) => {
          const item = res?.lesson ?? res?.data ?? res ?? { id };
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
    setFormVideoUrl('');
    setFormCourseId('');
    setFormOrder('');
    setFormDuration('');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const titleObj = row.title && typeof row.title === 'object' ? row.title : null;
    const contentObj = row.content && typeof row.content === 'object' ? row.content : null;
    const trans = row.translations || {};
    const ar = trans.ar || row;
    const en = trans.en || row;
    setFormTitleAr(toFormValue(titleObj?.ar ?? row?.title_ar ?? ar?.title ?? row?.title));
    setFormTitleEn(toFormValue(titleObj?.en ?? row?.title_en ?? en?.title ?? row?.title));
    setFormContentAr(toFormValue(contentObj?.ar ?? row?.content_ar ?? ar?.content ?? row?.content));
    setFormContentEn(toFormValue(contentObj?.en ?? row?.content_en ?? en?.content ?? row?.content));
    setFormVideoUrl(toFormValue(row.video_url));
    setFormCourseId(toFormValue(row.course_id ?? row.courseId));
    setFormOrder(String(row.order ?? ''));
    setFormDuration(String(row.duration ?? ''));
    setModalOpen(true);
  };

  useEffect(() => {
    if (!editing?.id || !modalOpen) return;
    let cancelled = false;
    LessonService.getForEdit(editing.id)
      .then((res) => {
        if (cancelled) return;
        const d = res?.lesson ?? res?.data ?? res ?? {};
        const titleObj = d.title && typeof d.title === 'object' ? d.title : null;
        const contentObj = d.content && typeof d.content === 'object' ? d.content : null;
        const trans = d.translations || {};
        const ar = trans.ar || d;
        const en = trans.en || d;
        setFormTitleAr(toFormValue(titleObj?.ar ?? d.title_ar ?? ar?.title));
        setFormTitleEn(toFormValue(titleObj?.en ?? d.title_en ?? en?.title));
        setFormContentAr(toFormValue(contentObj?.ar ?? d.content_ar ?? ar?.content));
        setFormContentEn(toFormValue(contentObj?.en ?? d.content_en ?? en?.content));
        setFormVideoUrl(toFormValue(d.video_url));
        setFormCourseId(toFormValue(d.course_id ?? d.courseId));
        setFormOrder(String(d.order ?? ''));
        setFormDuration(String(d.duration ?? ''));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [editing?.id, modalOpen]);

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('title_ar', formTitleAr || formTitleEn || '');
    fd.append('title_en', formTitleEn || formTitleAr || '');
    fd.append('content_ar', formContentAr);
    fd.append('content_en', formContentEn);
    fd.append('video_url', formVideoUrl);
    fd.append('course_id', String(formCourseId ?? ''));
    fd.append('course_type', 'recorded'); // satisfy backend: "course type must be recorded"
    fd.append('order', formOrder || '1');
    fd.append('duration', formDuration || '0');
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
        const params = {
          title_ar: formTitleAr || formTitleEn,
          title_en: formTitleEn || formTitleAr,
          content_ar: formContentAr,
          content_en: formContentEn,
          video_url: formVideoUrl,
          course_id: formCourseId,
          order: formOrder || '1',
          duration: formDuration,
        };
        await LessonService.update(editing.id, params);
        toast.success(t('lessons.modalEdit'));
        setModalOpen(false);
        fetchData();
      } else {
        // Creation of lessons should be done from the course page (recorded courses only)
        toast.error(t('common.pleaseSelectCourse'));
      }
    } catch (err) {
      const msg = err?.data?.message ?? err?.message ?? 'Request failed';
      const errors = err?.data?.errors;
      if (errors && typeof errors === 'object') {
        const first = Object.values(errors).flat().find(Boolean);
        toast.error(first || msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    const title = row.title ?? row.translations?.ar?.title ?? row.translations?.en?.title ?? 'this';
    const ok = await confirm({
      title: t('lessons.deleteTitle'),
      message: t('lessons.deleteMessage', { title }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await LessonService.remove(row.id);
      toast.success(t('lessons.deleteTitle'));
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getTitle = (row) => {
    const t = row.title;
    if (t != null && typeof t === 'object') return t.en ?? t.ar ?? '—';
    return row.title ?? row.translations?.ar?.title ?? row.translations?.en?.title ?? row.id;
  };

  const coursesRecorded = courses.filter(isCourseRecorded);
  const getCourseById = (id) =>
    courses.find((c) => c.id == id || String(c.id) === String(id));

  const editingCourseId =
    editing?.course?.id ?? editing?.course_id ?? editing?.courseId ?? formCourseId;
  const editingCourse = getCourseById(editingCourseId);
  const editingCourseIsRecorded = isCourseRecorded(editingCourse);

  if (loading && !data.length) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">{t('lessons.title')}</h1>
        {/* Creation of lessons is handled from each recorded course page, so no "Add lesson" here */}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-[var(--color-primary)]">
          {t('lessons.courseFilter')}
        </label>
        <select
          value={courseId}
          onChange={(e) => { setCourseId(e.target.value); setPage(1); }}
          className="px-3 py-2 min-w-[200px] rounded-[var(--radius)] border border-[var(--color-border)] text-sm bg-[var(--color-surface)]"
        >
          <option value="">{t('lessons.allRecorded')}</option>
          {coursesRecorded.map((c) => (
            <option key={c.id} value={c.id}>
              {getCourseDisplayName(c)}
            </option>
          ))}
        </select>
      </div>
      <DataTable
        columns={[
          { key: 'title', header: t('lessons.title'), render: (r) => getTitle(r) },
          {
            key: 'course',
            header: t('lessons.courseFilter'),
            render: (r) => getCourseName(r.course ?? r.course_id ?? r.courseId, courses),
          },
          { key: 'order', header: t('lessons.order') },
        ]}
        data={data}
        meta={meta ?? undefined}
        onPageChange={(pageNum, linkUrl) => (linkUrl ? fetchByUrl(linkUrl) : setPage(pageNum))}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        emptyMessage={t('lessons.empty')}
        actions={(row) => (
          <div className="flex gap-1 justify-end">
            <Link to={`/lessons/${row.id}`}>
              <Button variant="ghost" className="!p-2 min-w-0" title="View" aria-label="View">
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
        title={t('lessons.modalEdit')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('lessons.titleAr')}
            value={formTitleAr}
            onChange={(e) => setFormTitleAr(e.target.value)}
          />
          <Input
            label={t('lessons.titleEn')}
            value={formTitleEn}
            onChange={(e) => setFormTitleEn(e.target.value)}
            required
          />
          <Input
            label={t('lessons.videoUrl')}
            value={formVideoUrl}
            onChange={(e) => setFormVideoUrl(e.target.value)}
            required
          />
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">
              {t('lessons.courseRecordedOnly')}
            </label>
            <select
              value={formCourseId}
              onChange={(e) => setFormCourseId(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]"
              required
            >
              <option value="">{t('lessons.selectCourse')}</option>
              {coursesRecorded.map((c) => (
                <option key={c.id} value={c.id}>
                  {getCourseDisplayName(c)}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t('lessons.order')}
            type="number"
            value={formOrder}
            onChange={(e) => setFormOrder(e.target.value)}
          />
          <Input
            label={t('lessons.duration')}
            type="number"
            value={formDuration}
            onChange={(e) => setFormDuration(e.target.value)}
          />
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">
              {t('lessons.contentAr')}
            </label>
            <textarea
              value={formContentAr}
              onChange={(e) => setFormContentAr(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">
              {t('lessons.contentEn')}
            </label>
            <textarea
              value={formContentEn}
              onChange={(e) => setFormContentEn(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={2}
            />
          </div>
          {editing && editingCourseIsRecorded && (
            <div className="pt-3 mt-2 border-t border-[var(--color-border)]">
              <p className="text-sm font-medium text-[var(--color-primary)] mb-2">
                Upload / Replace lesson video
              </p>
              <LessonVideoUploader
                lessonId={editing.id}
                onComplete={() => {
                  fetchData();
                }}
              />
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={submitting}>
              {t('common.update')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
