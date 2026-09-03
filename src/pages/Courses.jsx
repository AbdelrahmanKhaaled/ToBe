import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CourseService, SubCategoryService, LevelService, MentorService, UserService, CurrencyService } from '@/api';
import { DataTable, Button, Modal, Loading, IconView, IconEdit, IconTrash, IconCheck, IconX, RichTextField } from '@/components/ui';
import { useConfirm } from '@/utils/confirmDialog';
import { toast } from '@/utils/toast';
import { Input } from '@/components/ui/Input';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { fetchBilingualEdit } from '@/utils/bilingualEdit';
import { appendArrayToFormData, appendPricesToFormData } from '@/utils/formDataHelpers';
import { toastApiError } from '@/utils/apiErrors';
import { useBulkDelete } from '@/hooks/useBulkDelete';

function getItemName(item, lang = 'en') {
  if (!item) return '—';
  const loc = lang === 'ar' ? 'ar' : 'en';
  const n = item.name ?? item.name_ar ?? item.name_en ?? item.title;
  if (n != null && typeof n === 'object') {
    return String(n[loc] ?? n.en ?? n.ar ?? item.id ?? '');
  }
  if (n != null) return String(n);
  return String(item.id ?? '');
}

/** Value to send as mentor_id: the mentor record id (from mentors table). */
function getMentorValue(mentor) {
  if (!mentor) return '';
  return String(mentor.id ?? '');
}

function isMentorRoleUser(user) {
  if (!user) return false;
  if (typeof user.role === 'string' && user.role.toLowerCase() === 'mentor') return true;
  const roles = user.roles;
  if (!Array.isArray(roles)) return false;
  return roles.some((r) => String(r).toLowerCase() === 'mentor');
}

function resolveMentorIdForUser(user, mentors) {
  if (!user) return '';
  const explicit = user.mentor_id ?? user.mentorId;
  if (explicit != null && Array.isArray(mentors) && mentors.some((m) => String(m.id) === String(explicit))) {
    return String(explicit);
  }
  const byUserId = Array.isArray(mentors)
    ? mentors.find((m) => m.user_id != null && String(m.user_id) === String(user.id))
    : null;
  if (byUserId) return String(byUserId.id);
  if (Array.isArray(mentors) && mentors.some((m) => String(m.id) === String(user.id))) {
    return String(user.id);
  }
  const email = (user.email || '').trim().toLowerCase();
  if (email && Array.isArray(mentors)) {
    const byEmail = mentors.find((m) => (m.email || '').trim().toLowerCase() === email);
    if (byEmail) return String(byEmail.id);
  }
  const name = (user.name || '').trim().toLowerCase();
  if (name && Array.isArray(mentors)) {
    const byName = mentors.find((m) => {
      const ne = getItemName(m, 'en').trim().toLowerCase();
      const na = getItemName(m, 'ar').trim().toLowerCase();
      return ne === name || na === name;
    });
    if (byName) return String(byName.id);
  }
  if (!Array.isArray(mentors) || mentors.length === 0) {
    if (user.id != null) return String(user.id);
  }
  return '';
}

/** Mentor user ids for `mentors[1]`, `mentors[2]`, … (excludes primary `mentor_id` / `mentor`). */
function coMentorIdsFromRow(row) {
  if (!row || typeof row !== 'object') return [];
  const primary = row.mentor?.id ?? row.mentor_id ?? null;
  const list = Array.isArray(row.mentors) ? row.mentors : [];
  const rawIds = list
    .map((m) => (m && typeof m === 'object' ? m.id : m))
    .filter((id) => id != null)
    .map(String);
  if (primary == null) return [...new Set(rawIds)];
  const p = String(primary);
  return [...new Set(rawIds.filter((id) => id !== p))];
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

function currencyLabel(c) {
  if (!c) return '';
  const code = c.code ?? c.currency_code ?? c.symbol;
  const name = c.name ?? c.title;
  if (code && name && String(name) !== String(code)) return `${code} — ${name}`;
  return String(code ?? name ?? c.id ?? '');
}

function pricesMapFromRow(row) {
  const map = {};
  const list = row?.prices ?? row?.course_prices ?? [];
  if (Array.isArray(list)) {
    list.forEach((p) => {
      const cid = p?.currency_id ?? p?.currency?.id;
      const price = p?.price ?? p?.amount;
      if (cid != null && price != null && String(price).trim() !== '') {
        map[String(cid)] = String(price);
      }
    });
  }
  return map;
}

function buildPriceRows(currencies, formPrices) {
  return (Array.isArray(currencies) ? currencies : [])
    .map((c) => {
      const cid = c?.id;
      if (cid == null) return null;
      const price = formPrices[String(cid)];
      if (price == null || String(price).trim() === '') return null;
      return { currency_id: String(cid), price: String(price).trim() };
    })
    .filter(Boolean);
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
  const [formPrices, setFormPrices] = useState({});
  const [currencies, setCurrencies] = useState([]);
  const [formPricePoints, setFormPricePoints] = useState('');
  const [formSubCategoryId, setFormSubCategoryId] = useState('');
  const [formLevelId, setFormLevelId] = useState('');
  const [formMentorId, setFormMentorId] = useState('');
  const [formCoMentorIds, setFormCoMentorIds] = useState([]);
  const [formVisibility, setFormVisibility] = useState('public');
  const [formPrivateUserIds, setFormPrivateUserIds] = useState([]);
  const [studentUsers, setStudentUsers] = useState([]);
  const [formEarningPoints, setFormEarningPoints] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const confirm = useConfirm();
  const { user: authUser } = useAuth();

  const mentorSelectLocked = Boolean(authUser && isMentorRoleUser(authUser));

  const [filterAccepted, setFilterAccepted] = useState('');
  const [filterSubCategoryId, setFilterSubCategoryId] = useState('');
  const [filterLevelId, setFilterLevelId] = useState('');
  const [filterMentorId, setFilterMentorId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const [subCategories, setSubCategories] = useState([]);
  const [levels, setLevels] = useState([]);
  const [mentors, setMentors] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await CourseService.getAll({
        search: search || undefined,
        page,
        per_page: 10,
        sub_category_id: filterSubCategoryId || undefined,
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
  }, [page, search, filterAccepted, filterSubCategoryId, filterLevelId, filterMentorId, filterType, lang]);

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
    (async () => {
      const results = await Promise.allSettled([
        SubCategoryService.getAll({ per_page: 500 }),
        LevelService.getAll({ per_page: 500 }),
        MentorService.getAll({ per_page: 500 }),
      ]);
      if (cancelled) return;
      const pick = (idx) => {
        const r = results[idx];
        if (r.status !== 'fulfilled') {
          const label = idx === 0 ? 'Sub-categories' : idx === 1 ? 'Levels' : 'Mentors';
          toast.error(r.reason?.message ?? `${label}: failed to load`);
          return [];
        }
        const d = r.value?.data;
        return Array.isArray(d) ? d : [];
      };
      setSubCategories(pick(0));
      setLevels(pick(1));
      setMentors(pick(2));
    })();
    return () => { cancelled = true; };
  }, [lang]);

  useEffect(() => {
    if (!modalOpen || !mentorSelectLocked) return;
    const mid = resolveMentorIdForUser(authUser, mentors);
    if (mid) setFormMentorId(mid);
  }, [modalOpen, mentorSelectLocked, authUser, mentors]);

  useEffect(() => {
    if (!formMentorId) return;
    setFormCoMentorIds((prev) => prev.filter((id) => String(id) !== String(formMentorId)));
  }, [formMentorId]);

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
    setFormPrices({});
    setFormPricePoints('');
    setFormSubCategoryId('');
    setFormLevelId('');
    setFormMentorId(resolveMentorIdForUser(authUser, mentors));
    setFormCoMentorIds([]);
    setFormVisibility('public');
    setFormPrivateUserIds([]);
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
    setFormPrices(pricesMapFromRow(row));
    setFormPricePoints(row.price_points != null ? String(row.price_points) : row.pricePoints != null ? String(row.pricePoints) : '');
    setFormSubCategoryId(
      row.sub_category_id != null
        ? String(row.sub_category_id)
        : row.sub_category?.id != null
          ? String(row.sub_category.id)
          : ''
    );
    setFormLevelId(row.level_id != null ? String(row.level_id) : row.level?.id != null ? String(row.level.id) : '');
    setFormMentorId(row.mentor_id != null ? String(row.mentor_id) : row.mentor?.id != null ? String(row.mentor.id) : '');
    setFormCoMentorIds(coMentorIdsFromRow(row));
    setFormVisibility(row.visibility === 'private' ? 'private' : 'public');
    const uidList = row.user_ids ?? row.users?.map((u) => u.id) ?? [];
    setFormPrivateUserIds(Array.isArray(uidList) ? uidList.map(String) : []);
    setFormEarningPoints(row.earning_points != null ? String(row.earning_points) : '0');
    setModalOpen(true);
  };

  useEffect(() => {
    if (!editing?.id || !modalOpen) return;
    let cancelled = false;
    setEditLoading(true);
    fetchBilingualEdit({
      getForEdit: CourseService.getForEdit.bind(CourseService),
      id: editing.id,
      extractKeys: ['course', 'data'],
      bilingualFields: ['name', 'description'],
    })
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
        setFormPrices(pricesMapFromRow(d));
        setFormPricePoints(d.price_points != null ? String(d.price_points) : d.pricePoints != null ? String(d.pricePoints) : '');
        setFormSubCategoryId(
          d.sub_category_id != null
            ? String(d.sub_category_id)
            : d.sub_category?.id != null
              ? String(d.sub_category.id)
              : ''
        );
        setFormLevelId(d.level_id != null ? String(d.level_id) : d.level?.id != null ? String(d.level.id) : '');
        setFormMentorId(d.mentor_id != null ? String(d.mentor_id) : d.mentor?.id != null ? String(d.mentor.id) : '');
        setFormCoMentorIds(coMentorIdsFromRow(d));
        setFormVisibility(d.visibility === 'private' ? 'private' : 'public');
        const uidList = d.user_ids ?? d.users?.map((u) => u.id) ?? [];
        setFormPrivateUserIds(Array.isArray(uidList) ? uidList.map(String) : []);
        setFormEarningPoints(d.earning_points != null ? String(d.earning_points) : '0');
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setEditLoading(false);
      });
    return () => { cancelled = true; };
  }, [editing?.id, modalOpen]);

  useEffect(() => {
    if (!modalOpen) return;
    let cancelled = false;
    Promise.all([
      UserService.getAll({ per_page: 200, page: 1 }),
      CurrencyService.getAll({ per_page: 100 }),
    ])
      .then(([usersRes, currenciesRes]) => {
        if (cancelled) return;
        setStudentUsers(Array.isArray(usersRes?.data) ? usersRes.data : []);
        setCurrencies(Array.isArray(currenciesRes?.data) ? currenciesRes.data : []);
      })
      .catch(() => {
        if (!cancelled) {
          setStudentUsers([]);
          setCurrencies([]);
        }
      });
    return () => { cancelled = true; };
  }, [modalOpen]);

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('name_ar', formNameAr || formNameEn || '');
    fd.append('name_en', formNameEn || formNameAr || '');
    fd.append('description_ar', formDescAr ?? '');
    fd.append('description_en', formDescEn ?? '');
    if (formImage) fd.append('image', formImage);
    fd.append('type', formType || 'live');
    appendPricesToFormData(fd, buildPriceRows(currencies, formPrices));
    fd.append('price_points', formPricePoints || '0');
    fd.append('sub_category_id', formSubCategoryId || '');
    fd.append('level_id', formLevelId || '');
    const mid =
      formMentorId ||
      (mentorSelectLocked && authUser?.id != null ? String(authUser.id) : '');
    fd.append('mentor_id', mid);
    const midStr = String(mid || '');
    const coIds = formCoMentorIds
      .map((id) => String(id).trim())
      .filter((id) => id && id !== midStr);
    appendArrayToFormData(fd, 'mentors', coIds);
    fd.append('visibility', formVisibility || 'public');
    if (formVisibility === 'private') {
      appendArrayToFormData(fd, 'user_ids', formPrivateUserIds);
    }
    fd.append('earning_points', formEarningPoints || '0');
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mentorOk =
      formMentorId ||
      (mentorSelectLocked && authUser?.id != null ? String(authUser.id) : '');
    if (!formSubCategoryId || !formLevelId || !mentorOk) {
      toast.error('Please select sub-category, level, and mentor.');
      return;
    }
    if (formVisibility === 'private' && formPrivateUserIds.length === 0) {
      toast.error(t('courses.privateUsersRequired', 'Select at least one user for a private course.'));
      return;
    }
    const priceRows = buildPriceRows(currencies, formPrices);
    if (priceRows.length === 0) {
      toast.error(t('courses.pricesRequired', 'Enter at least one price for a supported currency.'));
      return;
    }
    if (!editing && !formImage) {
      toast.error(t('courses.imageRequired', 'Course image is required.'));
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
      toastApiError(err, toast, 'Failed to save course');
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

  const { tableSelectionProps } = useBulkDelete({
    confirm,
    onDeleted: fetchData,
    removeOne: (id) => CourseService.remove(id),
    confirmTitle: t('courses.bulkDeleteTitle', 'Delete selected courses'),
    confirmMessage: (count) =>
      t('courses.bulkDeleteMessage', { count, defaultValue: 'Delete {{count}} courses?' }),
    successMessage: t('courses.bulkDeleted', 'Selected courses deleted'),
  });

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

  const getCourseName = (row) => {
    if (!row) return '—';
    const label = getItemName(row, lang);
    if (label && label !== '—') return label;
    return row.id != null ? String(row.id) : '—';
  };

  const getCourseDescriptionSnippet = (row) => {
    if (!row) return '';
    const loc = lang === 'ar' ? 'ar' : 'en';
    let d =
      row.description ??
      row.translations?.[loc]?.description ??
      row.translations?.ar?.description ??
      row.translations?.en?.description ??
      row.description_ar ??
      row.description_en ??
      '';
    if (d && typeof d === 'object') {
      d = d[loc] ?? d.en ?? d.ar ?? '';
    }
    const s = typeof d === 'string' ? d : String(d ?? '');
    return s.slice(0, 50) + (s.length > 50 ? '...' : '');
  };

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
          value={filterSubCategoryId}
          onChange={(e) => { setFilterSubCategoryId(e.target.value); setPage(1); }}
          className="px-3 py-2 min-w-[140px] rounded-[var(--radius)] border border-[var(--color-border)] text-sm bg-[var(--color-surface)]"
        >
          <option value="">{t('courses.filters.allSubCategories', 'All sub-categories')}</option>
          {subCategories.map((sc) => (
            <option key={sc.id} value={sc.id}>
              {getItemName(sc, lang)}
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
              {getItemName(l, lang)}
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
              {getItemName(m, lang)}
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
        {...tableSelectionProps}
        columns={[
          { key: 'name', header: t('courses.name'), render: (r) => getCourseName(r) },
          { key: 'accepted', header: t('courses.status'), render: (r) => getAcceptedBadge(r) },
          {
            key: 'description',
            header: t('courses.description'),
            render: (r) => getCourseDescriptionSnippet(r),
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
          {editLoading && <div className="text-sm text-gray-500">Loading full course details…</div>}
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
          <RichTextField label={t('courses.descAr')} value={formDescAr} onChange={setFormDescAr} />
          <RichTextField label={t('courses.descEn')} value={formDescEn} onChange={setFormDescEn} />
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">
              {t('courses.image')} {!editing ? '*' : ''}
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/gif,image/svg+xml"
              onChange={(e) => setFormImage(e.target.files?.[0] ?? null)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-sm file:mr-2 file:rounded file:border-0 file:bg-[var(--color-accent)] file:px-3 file:py-1 file:text-white file:text-sm"
              required={!editing}
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
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">
              {t('courses.prices', 'Prices')} *
            </label>
            <p className="text-xs text-gray-500 mt-0.5 mb-2">
              {t('courses.pricesHint', 'Enter the course price for each currency (same as Postman: prices[0][currency_id] + prices[0][price]). At least one currency is required.')}
            </p>
            {currencies.length === 0 ? (
              <p className="text-sm text-gray-500">{t('courses.loadingCurrencies', 'Loading currencies…')}</p>
            ) : (
              <div className="space-y-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg-light)] p-3">
                {currencies.map((c) => {
                  const cid = String(c.id);
                  return (
                    <div key={cid} className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-2 items-center">
                      <span className="text-sm text-[var(--color-primary)]">{currencyLabel(c)}</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0"
                        value={formPrices[cid] ?? ''}
                        onChange={(e) =>
                          setFormPrices((prev) => ({ ...prev, [cid]: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-white text-sm"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <Input
            type="number"
            min="0"
            step="1"
            label={t('courses.pricePoints', 'Price (points)')}
            value={formPricePoints}
            onChange={(e) => setFormPricePoints(e.target.value)}
          />
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('courses.subCategory', 'Sub-category *')}</label>
            <select
              value={formSubCategoryId}
              onChange={(e) => setFormSubCategoryId(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              required
            >
              <option value="">{t('courses.selectSubCategory', 'Select sub-category')}</option>
              {subCategories.map((sc) => (
                <option key={sc.id} value={sc.id}>{getItemName(sc, lang)}</option>
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
                <option key={l.id} value={l.id}>{getItemName(l, lang)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('courses.mentor')}</label>
            {mentorSelectLocked ? (
              <div className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg-light)] text-[var(--color-primary)]">
                {authUser?.name?.trim()
                  ? authUser.name
                  : getItemName(mentors.find((m) => String(m.id) === String(formMentorId)), lang) || '—'}
              </div>
            ) : (
              <select
                value={formMentorId}
                onChange={(e) => setFormMentorId(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
                required
              >
                <option value="">{t('courses.selectMentor')}</option>
                {mentors.map((m) => (
                  <option key={m.id} value={getMentorValue(m)}>{getItemName(m, lang)}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('courses.additionalMentors')}</label>
            <p className="text-xs text-gray-500 mt-0.5 mb-2">{t('courses.additionalMentorsHint')}</p>
            <div className="max-h-40 overflow-y-auto rounded-[var(--radius)] border border-[var(--color-border)] p-2 space-y-2 bg-[var(--color-bg-light)]">
              {mentors.filter((m) => String(getMentorValue(m)) !== String(formMentorId)).length === 0 ? (
                <span className="text-sm text-gray-500">{t('courses.selectMentor')}</span>
              ) : (
                mentors
                  .filter((m) => String(getMentorValue(m)) !== String(formMentorId))
                  .map((m) => {
                    const idStr = String(getMentorValue(m));
                    const checked = formCoMentorIds.includes(idStr);
                    return (
                      <label key={m.id} className="flex items-center gap-2 text-sm text-[var(--color-primary)] cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-[var(--color-border)]"
                          checked={checked}
                          onChange={(e) => {
                            setFormCoMentorIds((prev) => {
                              if (e.target.checked) return [...new Set([...prev, idStr])];
                              return prev.filter((x) => String(x) !== idStr);
                            });
                          }}
                        />
                        <span>{getItemName(m, lang)}</span>
                      </label>
                    );
                  })
              )}
            </div>
          </div>
          <Input
            type="number"
            min="0"
            label={t('courses.earningPoints')}
            value={formEarningPoints}
            onChange={(e) => setFormEarningPoints(e.target.value)}
          />
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">
              {t('courses.visibility', 'Visibility')}
            </label>
            <select
              value={formVisibility}
              onChange={(e) => setFormVisibility(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
            >
              <option value="public">{t('courses.visibilityPublic', 'Public — visible to everyone')}</option>
              <option value="private">{t('courses.visibilityPrivate', 'Private — selected users only')}</option>
            </select>
          </div>
          {formVisibility === 'private' ? (
            <div>
              <label className="text-sm font-medium text-[var(--color-primary)]">
                {t('courses.privateUsers', 'Allowed users')}
              </label>
              <p className="text-xs text-gray-500 mt-0.5 mb-2">
                {t('courses.privateUsersHint', 'Only selected users will see this course in the app.')}
              </p>
              <div className="max-h-40 overflow-y-auto rounded-[var(--radius)] border border-[var(--color-border)] p-2 space-y-2 bg-[var(--color-bg-light)]">
                {studentUsers.map((u) => {
                  const idStr = String(u.id);
                  return (
                    <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formPrivateUserIds.includes(idStr)}
                        onChange={(e) => {
                          setFormPrivateUserIds((prev) =>
                            e.target.checked ? [...new Set([...prev, idStr])] : prev.filter((x) => x !== idStr)
                          );
                        }}
                      />
                      <span>{u.name ?? u.email ?? idStr}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}
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
