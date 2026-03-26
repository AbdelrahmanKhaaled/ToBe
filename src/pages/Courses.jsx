import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CourseService, CategoryService, LevelService, MentorService } from '@/api';
import { DataTable, Button, Modal, Loading, IconView, IconEdit, IconTrash, IconCheck, IconX } from '@/components/ui';
import { useConfirm } from '@/utils/confirmDialog';
import { toast } from '@/utils/toast';
import { Input } from '@/components/ui/Input';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';

function getItemName(item) {
  if (!item) return '—';
  return item.name ?? item.name_ar ?? item.name_en ?? item.title ?? String(item.id ?? '');
}

/** Value to send as mentor_id: the mentor record id (from mentors table). */
function getMentorValue(mentor) {
  if (!mentor) return '';
  return String(mentor.id ?? '');
}

function toFormValue(val) {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    const v = val.title ?? val.name ?? val.description;
    return v != null ? String(v) : '';
  }
  return String(val);
}

export function Courses() {
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
  const [formImage, setFormImage] = useState(null);
  const [formType, setFormType] = useState('live');
  const [formPrice, setFormPrice] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formLevelId, setFormLevelId] = useState('');
  const [formMentorId, setFormMentorId] = useState('');
  const [formEarningPoints, setFormEarningPoints] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const confirm = useConfirm();

  const [filterAccepted, setFilterAccepted] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterLevelId, setFilterLevelId] = useState('');
  const [filterMentorId, setFilterMentorId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [levels, setLevels] = useState([]);
  const [mentors, setMentors] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await CourseService.getAll({
        search: search || undefined,
        page,
        per_page: 10,
        category_id: filterCategoryId || undefined,
        level_id: filterLevelId || undefined,
        mentor_id: filterMentorId || undefined,
        type: filterType || undefined,
        accepted: filterAccepted === '' ? undefined : filterAccepted,
      });
      setData(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterAccepted, filterCategoryId, filterLevelId, filterMentorId, filterType, lang]);

  const fetchByUrl = useCallback(async (url) => {
    setLoading(true);
    try {
      const res = await CourseService.getPageByUrl(url);
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
    Promise.all([
      CategoryService.getAll({ per_page: 500 }).then((r) => r.data),
      LevelService.getAll({ per_page: 500 }).then((r) => r.data),
      MentorService.getAll({ per_page: 500 }).then((r) => r.data),
    ])
      .then(([catData, lvlData, mntData]) => {
        if (!cancelled) {
          setCategories(Array.isArray(catData) ? catData : []);
          setLevels(Array.isArray(lvlData) ? lvlData : []);
          setMentors(Array.isArray(mntData) ? mntData : []);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [lang]);

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
      CourseService.getForEdit(id)
        .then((res) => {
          const item = res?.course ?? res?.data ?? res ?? { id };
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
    setFormImage(null);
    setFormType('live');
    setFormPrice('');
    setFormUrl('');
    setFormCategoryId('');
    setFormLevelId('');
    setFormMentorId('');
    setFormEarningPoints('0');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const nameObj = row.name && typeof row.name === 'object' ? row.name : null;
    const descObj = row.description && typeof row.description === 'object' ? row.description : null;
    const trans = row.translations || {};
    const ar = trans.ar || row;
    const en = trans.en || row;
    setFormNameAr(toFormValue(nameObj?.ar ?? row?.name_ar ?? row?.title_ar ?? ar?.name ?? ar?.title ?? row?.name ?? row?.title));
    setFormNameEn(toFormValue(nameObj?.en ?? row?.name_en ?? row?.title_en ?? en?.name ?? en?.title ?? row?.name ?? row?.title));
    setFormDescAr(toFormValue(descObj?.ar ?? row?.description_ar ?? ar?.description ?? row?.description));
    setFormDescEn(toFormValue(descObj?.en ?? row?.description_en ?? en?.description ?? row?.description));
    setFormImage(null);
    setFormType(row.type ?? 'live');
    setFormPrice(row.price != null ? String(row.price) : '');
    setFormUrl(row.url ?? '');
    setFormCategoryId(row.category_id != null ? String(row.category_id) : row.category?.id != null ? String(row.category.id) : '');
    setFormLevelId(row.level_id != null ? String(row.level_id) : row.level?.id != null ? String(row.level.id) : '');
    setFormMentorId(row.mentor_id != null ? String(row.mentor_id) : row.mentor?.id != null ? String(row.mentor.id) : '');
    setFormEarningPoints(row.earning_points != null ? String(row.earning_points) : '0');
    setModalOpen(true);
  };

  useEffect(() => {
    if (!editing?.id || !modalOpen) return;
    let cancelled = false;
    CourseService.getForEdit(editing.id)
      .then((data) => {
        if (cancelled || !data) return;
        const d = data;
        const nameObj = d.name && typeof d.name === 'object' ? d.name : null;
        const descObj = d.description && typeof d.description === 'object' ? d.description : null;
        const trans = d.translations || {};
        const ar = trans.ar || {};
        const en = trans.en || {};
        setFormNameAr(toFormValue(nameObj?.ar ?? d.name_ar ?? d.title_ar ?? ar?.name));
        setFormNameEn(toFormValue(nameObj?.en ?? d.name_en ?? d.title_en ?? en?.name));
        setFormDescAr(toFormValue(descObj?.ar ?? d.description_ar ?? ar?.description));
        setFormDescEn(toFormValue(descObj?.en ?? d.description_en ?? en?.description));
        setFormType(d.type ?? 'live');
        setFormPrice(d.price != null ? String(d.price) : '');
        setFormUrl(d.url ?? '');
        setFormCategoryId(d.category_id != null ? String(d.category_id) : d.category?.id != null ? String(d.category.id) : '');
        setFormLevelId(d.level_id != null ? String(d.level_id) : d.level?.id != null ? String(d.level.id) : '');
        setFormMentorId(d.mentor_id != null ? String(d.mentor_id) : d.mentor?.id != null ? String(d.mentor.id) : '');
        setFormEarningPoints(d.earning_points != null ? String(d.earning_points) : '0');
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [editing?.id, modalOpen]);

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('name_ar', formNameAr || formNameEn || '');
    fd.append('name_en', formNameEn || formNameAr || '');
    fd.append('description_ar', formDescAr ?? '');
    fd.append('description_en', formDescEn ?? '');
    if (formImage) fd.append('image', formImage);
    fd.append('type', formType || 'live');
    fd.append('price', formPrice || '0');
    fd.append('url', formUrl ?? '');
    fd.append('category_id', formCategoryId || '');
    fd.append('level_id', formLevelId || '');
    fd.append('mentor_id', '5');
    fd.append('earning_points', formEarningPoints || '0');
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formCategoryId || !formLevelId || !formMentorId) {
      toast.error('Please select category, level, and mentor.');
      return;
    }
    if (formType === 'recorded' && !formUrl?.trim()) {
      toast.error('URL is required when type is Recorded.');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await CourseService.update(editing.id, buildFormData());
        toast.success('Course updated');
      } else {
        await CourseService.create(buildFormData());
        toast.success('Course created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (row) => {
    try {
      await CourseService.accept(row.id);
      toast.success('Course accepted');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReject = async (row) => {
    const courseName = getCourseName(row);
    const ok = await confirm({
      title: t('courses.rejectDeleteTitle'),
      message: t('courses.rejectDeleteMessage', { name: courseName }),
      confirmLabel: t('courses.reject', 'Reject'),
      variant: 'danger',
    });
    if (!ok) return;
    const courseId = row.id ?? row.course_id;
    try {
      try {
        await CourseService.reject(courseId);
      } catch (_) {
        // Reject endpoint may not exist or fail; we still delete below
      }
      await CourseService.remove(courseId);
      toast.success('Course rejected and deleted');
      fetchData();
    } catch (err) {
      toast.error(err?.message ?? 'Failed to delete course');
    }
  };

  const handleDelete = async (row) => {
    const courseName = getCourseName(row);
    const ok = await confirm({
      title: t('courses.deleteTitle'),
      message: t('courses.deleteMessage', { name: courseName }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;
    const courseId = row.id ?? row.course_id;
    try {
      await CourseService.remove(courseId);
      toast.success('Course deleted');
      fetchData();
    } catch (err) {
      toast.error(err?.message ?? 'Failed to delete course');
    }
  };

  const getCourseName = (row) =>
    row.name ?? row.translations?.ar?.name ?? row.translations?.en?.name ?? row.name_ar ?? row.name_en ?? row.title ?? row.translations?.ar?.title ?? row.translations?.en?.title ?? row.id ?? '—';

  const getAcceptedBadge = (row) => {
    const accepted = row.accepted;
    if (accepted === true || accepted === 1)
      return <span className="text-green-600 text-xs font-medium">{t('courses.filters.accepted')}</span>;
    if (accepted === false || accepted === 0)
      return <span className="text-amber-600 text-xs font-medium">{t('courses.filters.pending')}</span>;
    return <span className="text-gray-500 text-xs">—</span>;
  };

  if (loading && !data.length) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">{t('courses.title')}</h1>
        <Button onClick={openCreate}>{t('courses.add')}</Button>
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterCategoryId}
          onChange={(e) => { setFilterCategoryId(e.target.value); setPage(1); }}
          className="px-3 py-2 min-w-[140px] rounded-[var(--radius)] border border-[var(--color-border)] text-sm bg-[var(--color-surface)]"
        >
          <option value="">{t('courses.filters.allCategories')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {getItemName(c)}
            </option>
          ))}
        </select>
        <select
          value={filterLevelId}
          onChange={(e) => { setFilterLevelId(e.target.value); setPage(1); }}
          className="px-3 py-2 min-w-[140px] rounded-[var(--radius)] border border-[var(--color-border)] text-sm bg-[var(--color-surface)]"
        >
          <option value="">{t('courses.filters.allLevels')}</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>
              {getItemName(l)}
            </option>
          ))}
        </select>
        <select
          value={filterMentorId}
          onChange={(e) => { setFilterMentorId(e.target.value); setPage(1); }}
          className="px-3 py-2 min-w-[140px] rounded-[var(--radius)] border border-[var(--color-border)] text-sm bg-[var(--color-surface)]"
        >
          <option value="">{t('courses.filters.allMentors')}</option>
          {mentors.map((m) => (
            <option key={m.id} value={m.id}>
              {getItemName(m)}
            </option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-sm"
        >
          <option value="">{t('courses.filters.allTypes')}</option>
          <option value="live">{t('courses.filters.live')}</option>
          <option value="offline">{t('courses.filters.offline')}</option>
          <option value="recorded">{t('courses.filters.recorded')}</option>
        </select>
        <select
          value={filterAccepted}
          onChange={(e) => { setFilterAccepted(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-sm"
        >
          <option value="">{t('courses.filters.allStatus')}</option>
          <option value="1">{t('courses.filters.accepted')}</option>
          <option value="0">{t('courses.filters.pending')}</option>
        </select>
      </div>
      <DataTable
        columns={[
          { key: 'name', header: t('courses.name'), render: (r) => getCourseName(r) },
          { key: 'accepted', header: t('courses.status'), render: (r) => getAcceptedBadge(r) },
          {
            key: 'description',
            header: t('courses.description'),
            render: (r) => {
              const d = r.description ?? r.translations?.ar?.description ?? r.translations?.en?.description ?? '';
              return d.slice(0, 50) + (d.length > 50 ? '...' : '');
            },
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
        emptyMessage={t('courses.empty')}
        actions={(row) => (
          <div className="flex flex-wrap gap-1 justify-end">
            <Link to={`/courses/${row.id}`}>
              <Button
                variant="ghost"
                className="!p-2 min-w-0"
                title={t('common.view')}
                aria-label={t('common.view')}
              >
                <IconView />
              </Button>
            </Link>
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
        title={editing ? t('courses.modalEdit') : t('courses.modalCreate')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('courses.nameAr')}
            value={formNameAr}
            onChange={(e) => setFormNameAr(e.target.value)}
            required
          />
          <Input
            label={t('courses.nameEn')}
            value={formNameEn}
            onChange={(e) => setFormNameEn(e.target.value)}
            required
          />
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('courses.descAr')}</label>
            <textarea
              value={formDescAr}
              onChange={(e) => setFormDescAr(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('courses.descEn')}</label>
            <textarea
              value={formDescEn}
              onChange={(e) => setFormDescEn(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('courses.image')}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormImage(e.target.files?.[0] ?? null)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-sm file:mr-2 file:rounded file:border-0 file:bg-[var(--color-accent)] file:px-3 file:py-1 file:text-white file:text-sm"
              aria-required="false"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('courses.type')}</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              required
            >
              <option value="live">{t('courses.filters.live')}</option>
              <option value="offline">{t('courses.filters.offline')}</option>
              <option value="recorded">{t('courses.filters.recorded')}</option>
            </select>
          </div>
          <Input
            type="number"
            min="0"
            step="any"
            label={t('courses.price')}
            value={formPrice}
            onChange={(e) => setFormPrice(e.target.value)}
          />
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">
              {t('courses.url')}{' '}
              {formType === 'recorded' && `(${t('courses.urlRequiredRecorded')})`}
            </label>
            <input
              type="url"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              placeholder=""
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('courses.category')}</label>
            <select
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              required
            >
              <option value="">{t('courses.selectCategory')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{getItemName(c)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('courses.level')}</label>
            <select
              value={formLevelId}
              onChange={(e) => setFormLevelId(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              required
            >
              <option value="">{t('courses.selectLevel')}</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>{getItemName(l)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('courses.mentor')}</label>
            <select
              value={formMentorId}
              onChange={(e) => setFormMentorId(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              required
            >
              <option value="">{t('courses.selectMentor')}</option>
              {mentors.map((m) => (
                <option key={m.id} value={getMentorValue(m)}>{getItemName(m)}</option>
              ))}
            </select>
          </div>
          <Input
            type="number"
            min="0"
            label={t('courses.earningPoints')}
            value={formEarningPoints}
            onChange={(e) => setFormEarningPoints(e.target.value)}
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
