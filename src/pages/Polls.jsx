import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CourseService, PollService } from '@/api';
import { DataTable, Button, Modal, Loading, IconView, IconEdit, IconTrash } from '@/components/ui';
import { useConfirm } from '@/utils/confirmDialog';
import { toast } from '@/utils/toast';
import { Input } from '@/components/ui/Input';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';

function courseTitle(c) {
  if (!c) return '—';
  const t = c.title ?? c.name;
  if (t != null && typeof t === 'object') return String(t.ar ?? t.en ?? '');
  return String(t ?? c.id ?? '—');
}

function contentPreview(row) {
  const c = row?.content;
  const s = typeof c === 'string' ? c : '';
  if (!s) return '—';
  return s.length > 80 ? `${s.slice(0, 80)}…` : s;
}

/** Dashboard API: each option is `{ id, content, count, ... }`; fall back to older shapes. */
function pollOptionText(x) {
  if (typeof x === 'string') return x;
  if (x && typeof x === 'object') {
    const v = x.content ?? x.label ?? x.title ?? x.text ?? x.option_text ?? x.name;
    return v != null ? String(v) : '';
  }
  return '';
}

/** Map API poll options to form rows (min 2 slots for editing). */
function pollOptionsToRows(row) {
  const o = row?.options ?? row?.poll_options;
  if (!Array.isArray(o) || o.length === 0) return ['', ''];
  const texts = o.map((x) => pollOptionText(x));
  const next = [...texts];
  while (next.length < 2) next.push('');
  return next;
}

export function Polls() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [courses, setCourses] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formCourseId, setFormCourseId] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formVisibility, setFormVisibility] = useState('all');
  const [optionRows, setOptionRows] = useState(['', '']);
  const [submitting, setSubmitting] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const visibilityOptions = useMemo(
    () => [
      { value: 'all', label: t('polls.visibilityAll', 'All') },
      { value: 'enrolled', label: t('polls.visibilityEnrolled', 'Enrolled') },
    ],
    [t]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cRes = await CourseService.getAll({ per_page: 100, page: 1 });
        if (!cancelled) setCourses(cRes.data ?? []);
      } catch (err) {
        if (!cancelled) toast.error(err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [lang]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await PollService.getAll({
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
      const res = await PollService.getPageByUrl(url);
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

  const resetCreateForm = () => {
    setFormCourseId('');
    setFormContent('');
    setFormVisibility('all');
    setOptionRows(['', '']);
  };

  const openCreate = () => {
    setEditing(null);
    resetCreateForm();
    setModalOpen(true);
  };

  const applyPollToForm = useCallback((poll) => {
    if (!poll) return;
    setEditing(poll);
    setFormCourseId(String(poll.course_id ?? poll.course?.id ?? ''));
    setFormContent(typeof poll.content === 'string' ? poll.content : String(poll.content ?? ''));
    const vis = poll.visibility;
    setFormVisibility(vis === 'enrolled' ? 'enrolled' : 'all');
    setOptionRows(pollOptionsToRows(poll));
  }, []);

  const openEditById = useCallback(
    async (id) => {
      const pid = id != null ? String(id) : '';
      if (!pid) return;
      setEditLoading(true);
      try {
        const full = await PollService.getById(pid);
        const poll = full && typeof full === 'object' ? full : null;
        if (poll) {
          applyPollToForm(poll);
          setModalOpen(true);
        } else {
          toast.error(t('polls.notFound', 'Poll not found.'));
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setEditLoading(false);
      }
    },
    [applyPollToForm, t]
  );

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

  /** Same shape as dashboard API: course_id, content, visibility, options[1]… */
  const buildPollFormData = () => {
    const fd = new FormData();
    fd.append('course_id', formCourseId);
    fd.append('content', formContent);
    fd.append('visibility', formVisibility);
    optionRows.forEach((text, i) => {
      const v = String(text ?? '').trim();
      if (v) fd.append(`options[${i + 1}]`, v);
    });
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const filled = optionRows.map((x) => String(x ?? '').trim()).filter(Boolean);
      if (filled.length < 2) {
        toast.error(t('polls.optionsMin', 'Add at least two options.'));
        setSubmitting(false);
        return;
      }
      if (editing) {
        await PollService.update(editing.id, buildPollFormData());
        toast.success(t('polls.toasts.updated', 'Poll updated'));
      } else {
        await PollService.create(buildPollFormData());
        toast.success(t('polls.toasts.created', 'Poll created'));
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
      title: t('polls.deleteTitle', 'Delete poll'),
      message: t('polls.deleteMessage', 'Delete this poll?'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await PollService.remove(row.id);
      toast.success(t('polls.toasts.deleted', 'Poll deleted'));
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const setOptionAt = (index, value) => {
    setOptionRows((rows) => {
      const next = [...rows];
      next[index] = value;
      return next;
    });
  };

  const addOptionRow = () => setOptionRows((rows) => [...rows, '']);
  const removeOptionRow = (index) => {
    setOptionRows((rows) => (rows.length <= 2 ? rows : rows.filter((_, i) => i !== index)));
  };

  if (loading && !data.length) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">{t('polls.title', 'Polls')}</h1>
        <Button onClick={openCreate}>{t('polls.add', 'Add poll')}</Button>
      </div>
      <DataTable
        columns={[
          { key: 'id', header: t('polls.columns.id', 'ID'), render: (r) => r.id },
          {
            key: 'course',
            header: t('polls.columns.course', 'Course'),
            render: (r) => courseTitle(r.course) || '—',
          },
          {
            key: 'content',
            header: t('polls.columns.content', 'Content'),
            render: (r) => contentPreview(r),
          },
          {
            key: 'visibility',
            header: t('polls.columns.visibility', 'Visibility'),
            render: (r) => r.visibility ?? '—',
          },
        ]}
        data={data}
        meta={meta ?? undefined}
        onPageChange={(pageNum, linkUrl) => (linkUrl ? fetchByUrl(linkUrl) : setPage(pageNum))}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        emptyMessage={t('polls.empty', 'No polls yet')}
        actions={(row) => (
          <div className="flex gap-1 justify-end">
            <Link to={`/polls/${row.id}`}>
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
              onClick={() => openEditById(row.id)}
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
        title={editing ? t('polls.modalEdit', 'Edit poll') : t('polls.modalCreate', 'Create poll')}
      >
        {editLoading ? (
          <Loading />
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)] block mb-1">
              {t('polls.course', 'Course')} *
            </label>
            <select
              value={formCourseId}
              onChange={(e) => setFormCourseId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-white"
            >
              <option value="">{t('polls.selectCourse', 'Select course')}</option>
              {courses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {courseTitle(c)} (#{c.id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)] block mb-1">
              {t('polls.content', 'Content')} *
            </label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              required
              rows={editing ? 4 : 3}
              className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)] block mb-1">
              {t('polls.visibility', 'Visibility')}
            </label>
            <select
              value={formVisibility}
              onChange={(e) => setFormVisibility(e.target.value)}
              className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-white"
            >
              {visibilityOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--color-primary)]">
                {t('polls.options', 'Options')}
              </span>
              <Button type="button" variant="ghost" className="text-sm" onClick={addOptionRow}>
                {t('polls.addOption', 'Add option')}
              </Button>
            </div>
            <div className="space-y-2">
              {optionRows.map((val, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <div className="flex-1 min-w-0">
                    <Input
                      label=""
                      value={val}
                      onChange={(e) => setOptionAt(idx, e.target.value)}
                      placeholder={t('polls.optionPlaceholder', 'Option text')}
                    />
                  </div>
                  {optionRows.length > 2 && (
                    <Button type="button" variant="ghost" onClick={() => removeOptionRow(idx)}>
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>
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
        )}
      </Modal>
    </div>
  );
}
