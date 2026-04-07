import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CourseService, PostService, TagService } from '@/api';
import { DataTable, Button, Modal, Loading, IconView, IconEdit, IconTrash } from '@/components/ui';
import { useConfirm } from '@/utils/confirmDialog';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';

/**
 * Stable id for an existing post image row (API may use id, post_image_id, etc.).
 */
function getPostImagePersistId(img) {
  if (!img || typeof img !== 'object') return null;
  const raw =
    img.id ??
    img.post_image_id ??
    img.image_id ??
    img.media_id ??
    img.post_image?.id;
  if (raw == null || String(raw).trim() === '') return null;
  return String(raw).trim();
}

function courseTitle(c, lang = 'en') {
  if (!c) return '—';
  const loc = lang === 'ar' ? 'ar' : 'en';
  const t = c.title ?? c.name;
  if (t != null && typeof t === 'object') return String(t[loc] ?? t.en ?? t.ar ?? '');
  return String(t ?? c.id ?? '—');
}

function tagLabel(tag) {
  const n = tag?.name;
  if (n != null && typeof n === 'object') return String(n.ar ?? n.en ?? tag.id ?? '');
  return String(n ?? tag?.id ?? '');
}

function contentPreview(row) {
  const c = row?.content;
  const s = typeof c === 'string' ? c : '';
  if (!s) return '—';
  return s.length > 80 ? `${s.slice(0, 80)}…` : s;
}

function collectTagIdsFromPost(row) {
  const tags = row?.tags;
  if (!Array.isArray(tags)) return [];
  return tags.map((t) => t.id ?? t).filter((id) => id != null);
}

function ExistingImageThumb({ img, allowRemove, onRemove, removeLabel }) {
  const src = img?.image_url ?? img?.url;
  if (!src) return null;
  return (
    <div className="relative rounded-[var(--radius)] border border-[var(--color-border)] overflow-hidden bg-[var(--color-bg-light)] w-[100px] shrink-0">
      <img src={src} alt="" className="h-20 w-full object-cover" />
      {allowRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 end-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white text-sm leading-none hover:bg-black/80"
          aria-label={removeLabel}
          title={removeLabel}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

function StagedImageThumb({ file, onRemove, removeLabel }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <div className="relative group rounded-[var(--radius)] border border-[var(--color-border)] overflow-hidden bg-[var(--color-bg-light)] w-[100px] shrink-0">
      <img src={url} alt="" className="h-20 w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 end-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white text-sm leading-none hover:bg-black/80"
        aria-label={removeLabel}
        title={removeLabel}
      >
        ×
      </button>
      <div className="px-1 py-0.5 text-[10px] text-gray-600 truncate" title={file.name}>
        {file.name}
      </div>
    </div>
  );
}

export function Posts() {
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
  const [allTags, setAllTags] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formCourseId, setFormCourseId] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formVisibility, setFormVisibility] = useState('all');
  const [formTagIds, setFormTagIds] = useState([]);
  const [formImages, setFormImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [removedExistingImageIds, setRemovedExistingImageIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const visibilityOptions = useMemo(
    () => [
      { value: 'all', label: t('posts.visibilityAll', 'All') },
      { value: 'enrolled', label: t('posts.visibilityEnrolled', 'Enrolled') },
    ],
    [t]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cRes, tRes] = await Promise.all([
          CourseService.getAll({ per_page: 100, page: 1 }),
          TagService.getAll({ per_page: 200, page: 1 }),
        ]);
        if (!cancelled) {
          setCourses(cRes.data ?? []);
          setAllTags(tRes.data ?? []);
        }
      } catch (err) {
        if (!cancelled) toast.error(err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [lang]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await PostService.getAll({
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
      const res = await PostService.getPageByUrl(url);
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

  const resetForm = useCallback(() => {
    setFormCourseId('');
    setFormContent('');
    setFormVisibility('all');
    setFormTagIds([]);
    setFormImages([]);
    setExistingImages([]);
    setRemovedExistingImageIds([]);
  }, []);

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setModalOpen(true);
  };

  const openEdit = useCallback((row) => {
    setEditing(row);
    const cid = row.course_id ?? row.course?.id ?? '';
    setFormCourseId(cid != null ? String(cid) : '');
    const rawContent = row.content;
    setFormContent(typeof rawContent === 'string' ? rawContent : String(rawContent ?? ''));
    setFormVisibility(row.visibility === 'enrolled' ? 'enrolled' : 'all');
    setFormTagIds(collectTagIdsFromPost(row).map(String));
    setFormImages([]);
    setRemovedExistingImageIds([]);
    const imgs = Array.isArray(row.images) ? row.images : [];
    setExistingImages(
      imgs.map((img) =>
        img && typeof img === 'object' ? img : { id: null, image_url: String(img ?? '') }
      )
    );
    setModalOpen(true);
  }, []);

  const openEditById = useCallback(async (id) => {
    const pid = id != null ? String(id) : id;
    if (pid == null || pid === '') return;
    setEditLoading(true);
    try {
      const full = await PostService.getForEdit(pid);
      const row = full && typeof full === 'object' ? full.post ?? full : null;
      if (row) openEdit(row);
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

  const createFromCourse = searchParams.get('create');
  const presetCourseId = searchParams.get('course_id');
  const presetHandledRef = useRef(false);
  useEffect(() => {
    if (createFromCourse !== '1' || presetCourseId == null || presetCourseId === '') {
      presetHandledRef.current = false;
      return;
    }
    if (presetHandledRef.current) return;
    presetHandledRef.current = true;
    setSearchParams(
      (p) => {
        const next = new URLSearchParams(p);
        next.delete('create');
        next.delete('course_id');
        return next;
      },
      { replace: true }
    );
    setEditing(null);
    resetForm();
    setFormCourseId(String(presetCourseId));
    setModalOpen(true);
  }, [createFromCourse, presetCourseId, resetForm, setSearchParams]);

  /**
   * Create: course_id, content, visibility, tags[n], images[n] (Postman).
   * Update: POST multipart with _method=PUT (PostService) + same fields.
   * Existing image row ids to retain: sent under several common Laravel key names
   * (backend may only read one; × removes an id from this list).
   */
  const buildPostFormData = (isUpdate) => {
    const fd = new FormData();
    fd.append('content', formContent);
    fd.append('visibility', formVisibility);
    if (!isUpdate) {
      fd.append('course_id', formCourseId);
    } else if (formCourseId) {
      fd.append('course_id', formCourseId);
    }
    formTagIds.forEach((tagId, i) => {
      if (tagId != null && String(tagId).trim() !== '') fd.append(`tags[${i + 1}]`, String(tagId).trim());
    });
    if (isUpdate) {
      const keepIds = existingImages
        .map((img) => getPostImagePersistId(img))
        .filter((id) => id && !removedExistingImageIds.includes(id));
      keepIds.forEach((id) => {
        fd.append('existing_images[]', id);
      });
      keepIds.forEach((id, i) => {
        fd.append(`keep_image_ids[${i + 1}]`, id);
      });
      removedExistingImageIds.forEach((id) => {
        if (id != null && String(id).trim() !== '') fd.append('deleted_images[]', String(id).trim());
      });
      formImages.forEach((file, i) => {
        if (file instanceof File) fd.append(`images[${i + 1}]`, file);
      });
    } else {
      formImages.forEach((file, i) => {
        if (file instanceof File) fd.append(`images[${i + 1}]`, file);
      });
    }
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editing && !String(formCourseId).trim()) {
      toast.error(t('posts.selectCourse', 'Select course'));
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await PostService.update(editing.id, buildPostFormData(true));
        toast.success(t('posts.toasts.updated', 'Post updated'));
      } else {
        await PostService.create(buildPostFormData(false));
        toast.success(t('posts.toasts.created', 'Post created'));
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
      title: t('posts.deleteTitle', 'Delete post'),
      message: t('posts.deleteMessage', 'Delete this post?'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await PostService.remove(row.id);
      toast.success(t('posts.toasts.deleted', 'Post deleted'));
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleTag = (id) => {
    const sid = String(id);
    setFormTagIds((prev) => (prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]));
  };

  if (loading && !data.length) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">{t('posts.title', 'Posts')}</h1>
        <Button onClick={openCreate}>{t('posts.add', 'Add post')}</Button>
      </div>
      <DataTable
        columns={[
          { key: 'id', header: t('posts.columns.id', 'ID'), render: (r) => r.id },
          {
            key: 'course',
            header: t('posts.columns.course', 'Course'),
            render: (r) => courseTitle(r.course, lang) || '—',
          },
          {
            key: 'content',
            header: t('posts.columns.content', 'Content'),
            render: (r) => contentPreview(r),
          },
          {
            key: 'visibility',
            header: t('posts.columns.visibility', 'Visibility'),
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
        emptyMessage={t('posts.empty', 'No posts yet')}
        actions={(row) => (
          <div className="flex gap-1 justify-end">
            <Link to={`/posts/${row.id}`}>
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
        title={editing ? t('posts.modalEdit', 'Edit post') : t('posts.modalCreate', 'Create post')}
      >
        {editLoading ? (
          <Loading />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[var(--color-primary)] block mb-1">
                {t('posts.course', 'Course')}
                {!editing && ' *'}
              </label>
              <select
                value={formCourseId}
                onChange={(e) => setFormCourseId(e.target.value)}
                required={!editing}
                className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-white"
              >
                <option value="">{t('posts.selectCourse', 'Select course')}</option>
                {courses.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {courseTitle(c, lang)} (#{c.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-primary)] block mb-1">
                {t('posts.content', 'Content')} *
              </label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                required
                rows={4}
                className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-primary)] block mb-1">
                {t('posts.visibility', 'Visibility')}
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
              <span className="text-sm font-medium text-[var(--color-primary)] block mb-2">
                {t('posts.tags', 'Tags')}
              </span>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border border-[var(--color-border)] rounded-[var(--radius)] p-2">
                {allTags.map((tag) => (
                  <label key={tag.id} className="inline-flex items-center gap-1 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formTagIds.includes(String(tag.id))}
                      onChange={() => toggleTag(tag.id)}
                    />
                    {tagLabel(tag)}
                  </label>
                ))}
              </div>
            </div>
            <div>
              {editing &&
              existingImages.some((im) => {
                const src = im?.image_url ?? im?.url;
                if (!src) return false;
                const pid = getPostImagePersistId(im);
                if (!pid) return true;
                return !removedExistingImageIds.includes(pid);
              }) ? (
                <div className="mb-3">
                  <span className="text-sm font-medium text-[var(--color-primary)] block mb-2">
                    {t('posts.existingImages', 'Current images')}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {existingImages.map((img, idx) => {
                      const src = img?.image_url ?? img?.url;
                      if (!src) return null;
                      const pid = getPostImagePersistId(img);
                      if (pid && removedExistingImageIds.includes(pid)) return null;
                      return (
                        <ExistingImageThumb
                          key={pid ?? `legacy-${idx}`}
                          img={img}
                          allowRemove={Boolean(pid)}
                          removeLabel={t('posts.removeExistingImage', 'Remove this image from the post')}
                          onRemove={() =>
                            setRemovedExistingImageIds((prev) =>
                              !pid ? prev : [...new Set([...prev, pid])]
                            )
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              ) : null}
              <label className="text-sm font-medium text-[var(--color-primary)] block mb-1">
                {editing
                  ? t('posts.addMoreImages', 'Add more images (optional)')
                  : t('posts.images', 'Images (optional)')}
              </label>
              <p className="text-xs text-gray-500 mb-2">{t('posts.imagesHint')}</p>
              <input
                type="file"
                accept="image/*"
                multiple
                key={editing ? `edit-${editing.id}-img` : 'new-post-img'}
                onChange={(e) => {
                  const picked = Array.from(e.target.files || []).filter((f) => f instanceof File);
                  if (picked.length) setFormImages((prev) => [...prev, ...picked]);
                  e.target.value = '';
                }}
                className="w-full text-sm file:mr-2 file:rounded file:border-0 file:bg-[var(--color-accent)] file:px-3 file:py-1.5 file:text-white file:text-sm"
              />
              {formImages.length > 0 ? (
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-gray-600">
                      {t('posts.filesSelected', { count: formImages.length })}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      className="!py-1 !px-2 text-xs"
                      onClick={() => setFormImages([])}
                    >
                      {t('posts.clearNewImages', 'Remove all new images')}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formImages.map((file, idx) => (
                      <StagedImageThumb
                        key={`${file.name}-${file.size}-${idx}`}
                        file={file}
                        removeLabel={t('posts.removeImage', 'Remove image')}
                        onRemove={() =>
                          setFormImages((prev) => prev.filter((_, i) => i !== idx))
                        }
                      />
                    ))}
                  </div>
                </div>
              ) : null}
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
