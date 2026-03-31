import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConsultationSessionService, ConsultationSubCategoryService, MentorService } from '@/api';
import { DataTable, Button, Modal, Loading, IconEdit, IconTrash, IconView } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { useConfirm } from '@/utils/confirmDialog';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';
import { getCurrentLanguage } from '@/utils/language';
import { useLanguage } from '@/context/LanguageContext';
import { fetchBilingualEdit } from '@/utils/bilingualEdit';

export function ConsultationSessions() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { lang } = useLanguage();

  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [subCategories, setSubCategories] = useState([]);
  const [mentors, setMentors] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formDescAr, setFormDescAr] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formContentAr, setFormContentAr] = useState('');
  const [formContentEn, setFormContentEn] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formType, setFormType] = useState('offline');
  const [formEarningPoints, setFormEarningPoints] = useState('');
  const [formSubCategoryId, setFormSubCategoryId] = useState('');
  const [formMentorId, setFormMentorId] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formImage, setFormImage] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const subCatById = useMemo(() => {
    const m = new Map();
    for (const sc of subCategories) m.set(String(sc.id), sc);
    return m;
  }, [subCategories]);

  const mentorById = useMemo(() => {
    const m = new Map();
    for (const me of mentors) m.set(String(me.id), me);
    return m;
  }, [mentors]);

  const fetchRefs = useCallback(async () => {
    try {
      const [subCatsRes, mentorsRes] = await Promise.all([
        ConsultationSubCategoryService.getAll({ page: 1, per_page: 200 }),
        MentorService.getAll({ page: 1, per_page: 200 }),
      ]);
      setSubCategories(Array.isArray(subCatsRes?.data) ? subCatsRes.data : []);
      setMentors(Array.isArray(mentorsRes?.data) ? mentorsRes.data : []);
    } catch (_) {
      setSubCategories([]);
      setMentors([]);
    }
  }, [lang]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ConsultationSessionService.getAll({ search: search || undefined, page, per_page: 10 });
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
      const res = await ConsultationSessionService.getPageByUrl(url);
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
    fetchRefs();
  }, [fetchRefs]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setFormNameAr('');
    setFormNameEn('');
    setFormDescAr('');
    setFormDescEn('');
    setFormContentAr('');
    setFormContentEn('');
    setFormPrice('');
    setFormDuration('');
    setFormType('offline');
    setFormEarningPoints('');
    setFormSubCategoryId('');
    setFormMentorId('');
    setFormVideoUrl('');
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
    const contentObj = row.content && typeof row.content === 'object' ? row.content : null;
    setFormNameAr(row.name_ar ?? nameObj?.ar ?? ar.name ?? row.name ?? '');
    setFormNameEn(row.name_en ?? nameObj?.en ?? en.name ?? row.name ?? '');
    setFormDescAr(row.description_ar ?? descObj?.ar ?? ar.description ?? row.description ?? '');
    setFormDescEn(row.description_en ?? descObj?.en ?? en.description ?? row.description ?? '');
    setFormContentAr(row.content_ar ?? contentObj?.ar ?? ar.content ?? row.content ?? '');
    setFormContentEn(row.content_en ?? contentObj?.en ?? en.content ?? row.content ?? '');
    setFormPrice(String(row.price ?? ''));
    setFormDuration(String(row.duration ?? ''));
    setFormType(row.type ?? 'offline');
    setFormEarningPoints(String(row.earning_points ?? ''));
    setFormSubCategoryId(String(row.consultation_sub_category_id ?? row.consultation_sub_category?.id ?? ''));
    setFormMentorId(String(row.mentor_id ?? row.mentor?.id ?? ''));
    setFormVideoUrl(row.video_url ?? '');
    setFormImage(null);
    setModalOpen(true);
  };

  const openEditById = useCallback(async (id) => {
    const sessionId = id != null ? String(id) : id;
    if (sessionId == null || sessionId === '') return;
    setEditLoading(true);
    try {
      const merged = await fetchBilingualEdit({
        getForEdit: ConsultationSessionService.getForEdit.bind(ConsultationSessionService),
        id: sessionId,
        extractKeys: ['session', 'data'],
        bilingualFields: ['name', 'description', 'content'],
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
    fd.append('content_ar', formContentAr ?? '');
    fd.append('content_en', formContentEn ?? '');
    if (formPrice !== '') fd.append('price', formPrice);
    if (formDuration !== '') fd.append('duration', formDuration);
    if (formType) fd.append('type', formType);
    if (formEarningPoints !== '') fd.append('earning_points', formEarningPoints);
    if (formSubCategoryId) fd.append('consultation_sub_category_id', formSubCategoryId);
    if (formMentorId) fd.append('mentor_id', formMentorId);
    if (formVideoUrl) fd.append('video_url', formVideoUrl);
    if (formImage) fd.append('image', formImage);
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await ConsultationSessionService.update(editing.id, buildFormData());
        toast.success(t('consultationSessions.modalEdit'));
      } else {
        await ConsultationSessionService.create(buildFormData());
        toast.success(t('consultationSessions.modalCreate'));
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
      title: t('consultationSessions.deleteTitle'),
      message: t('consultationSessions.deleteMessage', { name }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await ConsultationSessionService.remove(row.id);
      toast.success(t('consultationSessions.deleteTitle'));
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

  const getSubCategoryName = (row) => {
    const lang = getCurrentLanguage();
    // Prefer embedded sub_category from session response
    if (row?.sub_category && typeof row.sub_category === 'object') {
      const sc = row.sub_category;
      if (sc?.name && typeof sc.name === 'object') {
        return sc.name?.[lang] ?? sc.name?.en ?? sc.name?.ar ?? sc.id ?? '-';
      }
      return sc?.name ?? sc?.id ?? '-';
    }
    const id = row.consultation_sub_category_id ?? row.consultation_sub_category?.id ?? '';
    if (!id) return '-';
    const sc = subCatById.get(String(id));
    if (sc?.name && typeof sc.name === 'object') {
      return sc.name?.[lang] ?? sc.name?.en ?? sc.name?.ar ?? id;
    }
    return sc?.name ?? sc?.translations?.ar?.name ?? sc?.translations?.en?.name ?? id;
  };

  const getMentorName = (row) => {
    const id = row.mentor_id ?? row.mentor?.id ?? '';
    if (!id) return '-';
    const m = mentorById.get(String(id));
    return m?.name ?? m?.email ?? id;
  };

  if (loading && !data.length) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">{t('consultationSessions.title')}</h1>
        <Button onClick={openCreate}>{t('consultationSessions.add')}</Button>
      </div>

      <DataTable
        columns={[
          { key: 'name', header: t('consultationSessions.name'), render: (r) => getDisplayName(r) },
          { key: 'type', header: t('consultationSessions.type'), render: (r) => r.type ?? '-' },
          { key: 'price', header: t('consultationSessions.price'), render: (r) => r.price ?? '-' },
          { key: 'duration', header: t('consultationSessions.duration'), render: (r) => r.duration ?? '-' },
          { key: 'sub_category', header: t('consultationSessions.subCategory'), render: (r) => getSubCategoryName(r) },
          { key: 'mentor', header: t('consultationSessions.mentor'), render: (r) => getMentorName(r) },
        ]}
        data={data}
        meta={meta ?? undefined}
        onPageChange={(pageNum, linkUrl) => (linkUrl ? fetchByUrl(linkUrl) : setPage(pageNum))}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        emptyMessage={t('consultationSessions.empty')}
        actions={(row) => (
          <div className="flex gap-1 justify-end">
            <Link to={`/consultation-sessions/${row.id}`}>
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
        title={editing ? t('consultationSessions.modalEdit') : t('consultationSessions.modalCreate')}
      >
        {editLoading ? (
          <Loading />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('consultationSessions.nameAr')} value={formNameAr} onChange={(e) => setFormNameAr(e.target.value)} required />
          <Input label={t('consultationSessions.nameEn')} value={formNameEn} onChange={(e) => setFormNameEn(e.target.value)} required />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label={t('consultationSessions.price')} type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
            <Input label={t('consultationSessions.duration')} type="number" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-[var(--color-primary)]">{t('consultationSessions.type')}</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-white"
              >
                <option value="offline">{t('consultationSessions.types.offline')}</option>
                <option value="live">{t('consultationSessions.types.live')}</option>
                <option value="recorded">{t('consultationSessions.types.recorded')}</option>
              </select>
            </div>
            <Input
              label={t('consultationSessions.earningPoints')}
              type="number"
              value={formEarningPoints}
              onChange={(e) => setFormEarningPoints(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-[var(--color-primary)]">{t('consultationSessions.subCategory')}</label>
              <select
                value={formSubCategoryId}
                onChange={(e) => setFormSubCategoryId(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-white"
                required
              >
                <option value="">{t('consultationSessions.selectSubCategory')}</option>
                {subCategories.map((sc) => (
                  <option key={sc.id} value={String(sc.id)}>
                    {sc?.name && typeof sc.name === 'object'
                      ? (sc.name?.[getCurrentLanguage()] ?? sc.name?.en ?? sc.name?.ar ?? sc.id)
                      : (sc.name ?? sc.translations?.ar?.name ?? sc.translations?.en?.name ?? sc.id)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-primary)]">{t('consultationSessions.mentor')}</label>
              <select
                value={formMentorId}
                onChange={(e) => setFormMentorId(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-white"
                required
              >
                <option value="">{t('consultationSessions.selectMentor')}</option>
                {mentors.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.name ?? m.email ?? m.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input label={t('consultationSessions.videoUrl')} value={formVideoUrl} onChange={(e) => setFormVideoUrl(e.target.value)} />

          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('consultationSessions.descAr')}</label>
            <textarea
              value={formDescAr}
              onChange={(e) => setFormDescAr(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('consultationSessions.descEn')}</label>
            <textarea
              value={formDescEn}
              onChange={(e) => setFormDescEn(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('consultationSessions.contentAr')}</label>
            <textarea
              value={formContentAr}
              onChange={(e) => setFormContentAr(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('consultationSessions.contentEn')}</label>
            <textarea
              value={formContentEn}
              onChange={(e) => setFormContentEn(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('consultationSessions.image')}</label>
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

