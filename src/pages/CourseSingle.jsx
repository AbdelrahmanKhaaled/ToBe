import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CourseService, LessonService } from '@/api';
import {
  Button,
  Loading,
  IconEdit,
  IconTrash,
  IconEdit as IconEditSmall,
  IconTrash as IconTrashSmall,
  IconView as IconViewSmall,
} from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { LessonVideoUploader } from '@/components/VideoChunkUploader';
import { toast } from '@/utils/toast';
import { useConfirm } from '@/utils/confirmDialog';
import { useLanguage } from '@/context/LanguageContext';
import { fetchBilingualEdit } from '@/utils/bilingualEdit';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/utils/permissions';

function unwrap(res, key = 'course') {
  return res?.[key] ?? res?.data ?? res ?? null;
}

function getCourseName(row) {
  return row?.name ?? row?.translations?.ar?.name ?? row?.translations?.en?.name ?? row?.name_ar ?? row?.name_en ?? '—';
}

function getDesc(row) {
  return row?.description ?? row?.translations?.ar?.description ?? row?.translations?.en?.description ?? '—';
}

const SKIP_KEYS = new Set([
  'title',
  'posts_count',
  'polls_count',
  'created_at',
  'updated_at',
  'email_verified_at',
]);
const DATE_KEY_PATTERN = /_at$|date/i;

function shouldSkipKey(key) {
  if (SKIP_KEYS.has(key)) return true;
  if (DATE_KEY_PATTERN.test(key)) return true;
  return false;
}

function humanizeLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getRelationName(obj) {
  if (obj == null || typeof obj !== 'object') return '—';
  const name = obj.name ?? obj.title ?? obj.name_ar ?? obj.name_en ?? '';
  return String(name).trim() || '—';
}

/** Course detail may include `mentors` as an array; show names only (no raw JSON). */
function formatMentorsValue(value) {
  if (value == null) return '—';
  if (Array.isArray(value)) {
    const names = value
      .map((m) => (m && typeof m === 'object' ? getRelationName(m) : '—'))
      .filter((n) => n && n !== '—');
    return names.length ? names.join(', ') : '—';
  }
  if (typeof value === 'object') return getRelationName(value);
  return String(value);
}

function getDisplayValue(key, value, t) {
  if (value === null || value === undefined) return '—';
  if (key === 'mentors') {
    return formatMentorsValue(value);
  }
  if (key === 'category' || key === 'sub_category' || key === 'level' || key === 'mentor') {
    return getRelationName(value);
  }
  if (key === 'accepted') {
    const accepted = value === true || value === 1;
    return accepted ? t?.('common.accepted', 'Accepted') ?? 'Accepted' : t?.('common.pending', 'Pending') ?? 'Pending';
  }
  if ((key === 'image_url' || key === 'image') && typeof value === 'string') {
    return value;
  }
  if (key === 'url' && typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

const RELATION_KEYS = new Set(['category', 'sub_category', 'level', 'mentor', 'mentors']);

function labelForKey(key, t) {
  const map = {
    id: t('common.id', 'ID'),
    name: t('common.name', 'Name'),
    description: t('common.description', 'Description'),
    image_url: t('common.image', 'Image'),
    image: t('common.image', 'Image'),
    type: t('common.type', 'Type'),
    price: t('common.price', 'Price'),
    url: t('common.url', 'URL'),
    category: t('common.category', 'Category'),
    sub_category: t('common.subCategory', 'Sub Category'),
    level: t('common.level', 'Level'),
    mentor: t('common.mentor', 'Mentor'),
    mentors: t('common.mentors', 'Mentors'),
    students_count: t('courses.studentsCount', 'Students count'),
    lessons_count: t('courses.lessonsCount', 'Lessons count'),
    earning_points: t('common.earningPoints', 'Earning points'),
    accepted: t('common.status', 'Status'),
  };
  return map[key] ?? humanizeLabel(key);
}

function buildDisplayRows(item, t) {
  const rows = [];
  const order = [
    'id',
    'name',
    'description',
    'image_url',
    'image',
    'type',
    'price',
    'url',
    'category',
    'level',
    'mentor',
    'mentors',
    'students_count',
    'lessons_count',
    'earning_points',
    'accepted',
  ];
  const seen = new Set();
  for (const key of order) {
    if (key in item && !shouldSkipKey(key)) {
      // Skip 'image' if 'image_url' already present to avoid duplicate image row
      if (key === 'image' && 'image_url' in item && item.image_url) continue;
      seen.add(key);
      const raw = item[key];
      rows.push({
        key,
        label: labelForKey(key, t),
        value: getDisplayValue(key, raw, t),
        raw: RELATION_KEYS.has(key) ? raw : undefined,
      });
    }
  }
  for (const key of Object.keys(item)) {
    if (seen.has(key) || shouldSkipKey(key)) continue;
    if (key === 'lessons' || key === 'posts' || key === 'polls' || key === 'articles') continue;
    if (typeof item[key] === 'function') continue;
    const rawVal = item[key];
    rows.push({
      key,
      label: labelForKey(key, t),
      value: getDisplayValue(key, rawVal, t),
      raw: RELATION_KEYS.has(key) ? rawVal : undefined,
    });
  }
  return rows;
}

function getLessonTitle(lesson) {
  if (!lesson || typeof lesson !== 'object') return '—';
  return lesson.title ?? lesson.name ?? lesson.name_ar ?? lesson.name_en ?? lesson.content?.slice?.(0, 50) ?? '—';
}

function getPostTitle(post) {
  if (!post || typeof post !== 'object') return '—';
  const content = post.content ?? post.title ?? post.name ?? '';
  const str = typeof content === 'string' ? content : String(content);
  return str.slice(0, 60) + (str.length > 60 ? '…' : '') || '—';
}

function getPollTitle(poll) {
  if (!poll || typeof poll !== 'object') return '—';
  const content = poll.content ?? poll.question ?? poll.title ?? poll.name ?? '';
  const str = typeof content === 'string' ? content : String(content);
  return str.slice(0, 60) + (str.length > 60 ? '…' : '') || '—';
}

function getArticleTitle(article) {
  if (!article || typeof article !== 'object') return '—';
  const t = article.title ?? article.name ?? article.heading ?? '';
  if (t != null && typeof t === 'object') {
    const v = t.ar ?? t.en ?? article.searchable_title ?? '';
    const s = typeof v === 'string' ? v : String(v ?? '');
    return s.slice(0, 60) + (s.length > 60 ? '…' : '') || '—';
  }
  const s = typeof t === 'string' ? t : String(t ?? '');
  if (s) return s.slice(0, 60) + (s.length > 60 ? '…' : '');
  const fallback = article.content ?? article.excerpt ?? '';
  const f = typeof fallback === 'string' ? fallback : String(fallback ?? '');
  return f.slice(0, 60) + (f.length > 60 ? '…' : '') || '—';
}

export function CourseSingle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const confirm = useConfirm();
  const { lang } = useLanguage();
  const { t } = useTranslation();
  const auth = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonEditLoading, setLessonEditLoading] = useState(false);
  const [lessonTitleAr, setLessonTitleAr] = useState('');
  const [lessonTitleEn, setLessonTitleEn] = useState('');
  const [lessonContentAr, setLessonContentAr] = useState('');
  const [lessonContentEn, setLessonContentEn] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonOrder, setLessonOrder] = useState('');
  const [lessonDuration, setLessonDuration] = useState('');
  const [lessonSubmitting, setLessonSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await CourseService.getById(id);
        const data = unwrap(res, 'course');
        if (!cancelled) setItem(data);
      } catch (err) {
        if (!cancelled) toast.error(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (id) load();
    return () => { cancelled = true; };
  }, [id, lang]);

  const refreshCourse = useCallback(async () => {
    if (!id) return;
    try {
      const res = await CourseService.getById(id);
      const data = unwrap(res, 'course');
      setItem(data);
    } catch (err) {
      toast.error(err.message);
    }
  }, [id]);

  const handleDelete = async () => {
    const courseName = getCourseName(item);
    const ok = await confirm({
      title: 'Delete course',
      message: `Delete "${courseName}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await CourseService.remove(item.id);
      toast.success('Course deleted');
      navigate('/courses');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openCreateLesson = async () => {
    if (!item) return;
    setEditingLesson(null);
    setLessonTitleAr('');
    setLessonTitleEn('');
    setLessonContentAr('');
    setLessonContentEn('');
    setLessonVideoUrl('');
    setLessonOrder('');
    setLessonDuration('');
    // Try to fetch next order from API for convenience
    try {
      setLessonsLoading(true);
      const res = await LessonService.getNextOrder(item.id);
      const nextOrder = Number(res?.order ?? res) || '';
      setLessonOrder(String(nextOrder));
    } catch {
      // ignore
    } finally {
      setLessonsLoading(false);
    }
    setLessonModalOpen(true);
  };

  const openEditLesson = async (lesson) => {
    const lessonId = lesson?.id;
    if (!lessonId) return;
    setLessonEditLoading(true);
    setLessonModalOpen(true);
    try {
      const merged = await fetchBilingualEdit({
        getForEdit: LessonService.getForEdit.bind(LessonService),
        id: lessonId,
        extractKeys: ['lesson', 'data'],
        bilingualFields: ['title', 'content'],
      });
      const d = merged ?? lesson;
      setEditingLesson(d);
      const title = d.title && typeof d.title === 'object' ? d.title : null;
      const content = d.content && typeof d.content === 'object' ? d.content : null;
      setLessonTitleAr(d.title_ar ?? title?.ar ?? '');
      setLessonTitleEn(d.title_en ?? title?.en ?? '');
      setLessonContentAr(d.content_ar ?? content?.ar ?? '');
      setLessonContentEn(d.content_en ?? content?.en ?? '');
      setLessonVideoUrl(d.video_url ?? '');
      setLessonOrder(String(d.order ?? ''));
      setLessonDuration(String(d.duration ?? ''));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLessonEditLoading(false);
    }
  };

  // Allow deep-link: /courses/:id?lesson_edit=123 to open the lesson edit modal.
  const lessonEditId = searchParams.get('lesson_edit');
  useEffect(() => {
    if (!lessonEditId || !item?.id) return;
    const lid = Number(lessonEditId) || lessonEditId;
    const clear = () =>
      setSearchParams((p) => {
        const next = new URLSearchParams(p);
        next.delete('lesson_edit');
        return next;
      });
    const found = Array.isArray(item.lessons) ? item.lessons.find((l) => String(l?.id) === String(lid)) : null;
    (async () => {
      try {
        if (found) await openEditLesson(found);
        else await openEditLesson({ id: lid });
      } finally {
        clear();
      }
    })();
  }, [lessonEditId, item?.id]);

  const handleSubmitLesson = async (e) => {
    e.preventDefault();
    if (!item) return;
    setLessonSubmitting(true);
    try {
      if (editingLesson) {
        const params = {
          title_ar: lessonTitleAr || lessonTitleEn,
          title_en: lessonTitleEn || lessonTitleAr,
          content_ar: lessonContentAr,
          content_en: lessonContentEn,
          video_url: lessonVideoUrl,
          course_id: item.id,
          order: lessonOrder || '1',
          duration: lessonDuration,
        };
        await LessonService.update(editingLesson.id, params);
        toast.success('Lesson updated');
        setLessonModalOpen(false);
        await refreshCourse();
      } else {
        const fd = new FormData();
        fd.append('title_ar', lessonTitleAr || lessonTitleEn || '');
        fd.append('title_en', lessonTitleEn || lessonTitleAr || '');
        fd.append('content_ar', lessonContentAr);
        fd.append('content_en', lessonContentEn);
        fd.append('video_url', lessonVideoUrl);
        fd.append('course_id', String(item.id));
        fd.append('course_type', item.type || 'recorded');
        fd.append('order', lessonOrder || '1');
        fd.append('duration', lessonDuration || '0');
        const created = await LessonService.create(fd);
        const newLesson = created?.lesson ?? created?.data ?? created ?? null;
        toast.success('Lesson created. You can now upload video.');
        if (newLesson && newLesson.id) {
          setEditingLesson(newLesson);
        }
        await refreshCourse();
      }
    } catch (err) {
      const msg = err?.data?.message ?? err?.message ?? 'Request failed';
      toast.error(msg);
    } finally {
      setLessonSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lesson) => {
    const title = getLessonTitle(lesson);
    const ok = await confirm({
      title: 'Delete lesson',
      message: `Delete "${title}"?`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await LessonService.remove(lesson.id);
      toast.success('Lesson deleted');
      await refreshCourse();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loading />;
  if (!item) return <div className="text-gray-500">Course not found.</div>;

  const displayRows = buildDisplayRows(item, t);

  const isRecordedCourse = item?.type === 'recorded';
  const canManageCourse = hasPermission(auth, 'courses');
  const canManageLessons = hasPermission(auth, 'lessons');

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          to={canManageCourse ? '/courses' : '/lessons'}
          className="text-[var(--color-accent)] hover:underline"
        >
          ← {canManageCourse ? 'Back to Courses' : 'Back to Lessons'}
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">{getCourseName(item)}</h1>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] overflow-hidden">
        <dl className="divide-y divide-[var(--color-border)]">
          {displayRows.map(({ key, label, value, raw }) => (
            <div key={key} className="px-4 py-3">
              <dt className="text-sm font-medium text-gray-500">{label}</dt>
              <dd className="mt-1 text-[var(--color-primary)]">
                {key === 'category' && raw?.id != null ? (
                  <Link to={`/categories/${raw.id}`} className="text-[var(--color-accent)] hover:underline">
                    {value}
                  </Link>
                ) : key === 'sub_category' && raw?.id != null ? (
                  <Link to={`/sub-categories/${raw.id}`} className="text-[var(--color-accent)] hover:underline">
                    {value}
                  </Link>
                ) : key === 'level' && raw?.id != null ? (
                  <Link to={`/levels/${raw.id}`} className="text-[var(--color-accent)] hover:underline">
                    {value}
                  </Link>
                ) : key === 'mentor' && raw?.id != null ? (
                  <Link to={`/mentors/${raw.id}`} className="text-[var(--color-accent)] hover:underline">
                    {value}
                  </Link>
                ) : key === 'mentors' && Array.isArray(raw) && raw.length > 0 ? (
                  <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5">
                    {raw.map((m, i) => (
                      <span key={m?.id ?? i}>
                        {i > 0 ? <span className="text-gray-400">, </span> : null}
                        {m && typeof m === 'object' && m.id != null ? (
                          <Link
                            to={`/mentors/${m.id}`}
                            className="text-[var(--color-accent)] hover:underline"
                          >
                            {getRelationName(m)}
                          </Link>
                        ) : (
                          getRelationName(m)
                        )}
                      </span>
                    ))}
                  </span>
                ) : key === 'accepted' ? (
                  <span
                    className={`inline-block px-2 py-1 rounded text-sm ${
                      value === 'Accepted' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {value}
                  </span>
                ) : (key === 'image_url' || key === 'image') && value && value !== '—' ? (
                  <img src={value} alt="" className="max-w-xs rounded-[var(--radius)] border border-[var(--color-border)]" />
                ) : key === 'url' && value && value !== '—' ? (
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-accent)] hover:underline break-all"
                  >
                    {value}
                  </a>
                ) : key === 'description' ? (
                  <span className="whitespace-pre-wrap block">{value}</span>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {isRecordedCourse && canManageLessons && (
        <div className="mt-6 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <h2 className="text-sm font-semibold text-[var(--color-primary)]">
              Lessons
            </h2>
            <Button
              variant="secondary"
              className="!px-3 !py-1 text-xs"
              onClick={openCreateLesson}
              disabled={lessonsLoading}
            >
              Add lesson
            </Button>
          </div>
          {Array.isArray(item.lessons) && item.lessons.length > 0 ? (
            <ul className="divide-y divide-[var(--color-border)]">
              {item.lessons.map((lesson) => (
                <li key={lesson.id} className="px-4 py-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {lesson.id != null ? (
                      <Link
                        to={`/lessons/${lesson.id}`}
                        className="text-[var(--color-accent)] hover:underline"
                      >
                        {getLessonTitle(lesson)}
                      </Link>
                    ) : (
                      <span className="text-[var(--color-primary)]">{getLessonTitle(lesson)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {lesson.id != null ? (
                      <Link to={`/lessons/${lesson.id}`}>
                        <Button
                          variant="ghost"
                          className="!p-1 min-w-0"
                          title="View lesson"
                          aria-label="View lesson"
                        >
                          <IconViewSmall />
                        </Button>
                      </Link>
                    ) : null}
                    <Button
                      variant="ghost"
                      className="!p-1 min-w-0"
                      title="Edit lesson"
                      aria-label="Edit lesson"
                      onClick={() => openEditLesson(lesson)}
                    >
                      <IconEditSmall />
                    </Button>
                    <Button
                      variant="danger"
                      className="!p-1 min-w-0"
                      title="Delete lesson"
                      aria-label="Delete lesson"
                      onClick={() => handleDeleteLesson(lesson)}
                    >
                      <IconTrashSmall />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-gray-500">No lessons yet for this course.</p>
          )}
        </div>
      )}

      <div className="mt-6 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-primary)]">
            Posts
          </h2>
          <Link to={`/posts?course_id=${item.id}&create=1`}>
            <Button variant="secondary" className="!px-3 !py-1 text-xs">
              Add post
            </Button>
          </Link>
        </div>
        {Array.isArray(item.posts) && item.posts.length > 0 ? (
          <ul className="divide-y divide-[var(--color-border)]">
            {item.posts.map((post) => (
              <li key={post.id} className="px-4 py-2">
                {post.id != null ? (
                  <Link
                    to={`/posts/${post.id}`}
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    {getPostTitle(post)}
                  </Link>
                ) : (
                  <span className="text-[var(--color-primary)]">
                    {getPostTitle(post)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-3 text-sm text-gray-500">No posts yet for this course.</p>
        )}
      </div>

      <div className="mt-6 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-primary)]">
            Articles
          </h2>
          <Link to="/articles">
            <Button variant="secondary" className="!px-3 !py-1 text-xs">
              Add article
            </Button>
          </Link>
        </div>
        {Array.isArray(item.articles) && item.articles.length > 0 ? (
          <ul className="divide-y divide-[var(--color-border)]">
            {item.articles.map((article) => (
              <li key={article.id ?? getArticleTitle(article)} className="px-4 py-2">
                {article.id != null ? (
                  <Link
                    to={`/articles/${article.id}`}
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    {getArticleTitle(article)}
                  </Link>
                ) : (
                  <span className="text-[var(--color-primary)]">{getArticleTitle(article)}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-3 text-sm text-gray-500">No articles yet for this course.</p>
        )}
      </div>

      {Array.isArray(item.polls) && item.polls.length > 0 && (
        <div className="mt-6 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] overflow-hidden">
          <h2 className="px-4 py-3 text-sm font-semibold text-[var(--color-primary)] border-b border-[var(--color-border)]">
            Polls
          </h2>
          <ul className="divide-y divide-[var(--color-border)]">
            {item.polls.map((poll) => (
              <li key={poll.id} className="px-4 py-2">
                {poll.id != null ? (
                  <Link
                    to={`/polls/${poll.id}`}
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    {getPollTitle(poll)}
                  </Link>
                ) : (
                  <span className="text-[var(--color-primary)]">{getPollTitle(poll)}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-4 flex gap-2">
        {canManageCourse ? (
          <>
            <Link to={`/courses?edit=${item.id}`}>
              <Button variant="secondary" className="!p-2" title="Edit course" aria-label="Edit course">
                <IconEdit />
              </Button>
            </Link>
            <Button variant="danger" className="!p-2" title="Delete course" aria-label="Delete course" onClick={handleDelete}>
              <IconTrash />
            </Button>
          </>
        ) : null}
      </div>

      {isRecordedCourse && canManageLessons && (
        <Modal
          open={lessonModalOpen}
          onClose={() => setLessonModalOpen(false)}
          title={editingLesson ? 'Edit lesson' : 'Create lesson'}
        >
          {lessonEditLoading && (
            <div className="text-sm text-gray-500 mb-2">Loading full lesson details…</div>
          )}
          <form onSubmit={handleSubmitLesson} className="space-y-4">
            <Input
              label="Title (Arabic)"
              value={lessonTitleAr}
              onChange={(e) => setLessonTitleAr(e.target.value)}
            />
            <Input
              label="Title (English)"
              value={lessonTitleEn}
              onChange={(e) => setLessonTitleEn(e.target.value)}
              required
            />
            <Input
              label="Order"
              type="number"
              value={lessonOrder}
              onChange={(e) => setLessonOrder(e.target.value)}
            />
            <Input
              label="Duration (min)"
              type="number"
              value={lessonDuration}
              onChange={(e) => setLessonDuration(e.target.value)}
            />
            <div>
              <label className="text-sm font-medium text-[var(--color-primary)]">Content (Arabic)</label>
              <textarea
                value={lessonContentAr}
                onChange={(e) => setLessonContentAr(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-primary)]">Content (English)</label>
              <textarea
                value={lessonContentEn}
                onChange={(e) => setLessonContentEn(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
                rows={2}
              />
            </div>
            {editingLesson?.id && (
              <div className="pt-3 mt-2 border-t border-[var(--color-border)]">
                <p className="text-sm font-medium text-[var(--color-primary)] mb-2">
                  Upload / Replace lesson video
                </p>
                <LessonVideoUploader
                  lessonId={editingLesson.id}
                  onComplete={async () => {
                    await refreshCourse();
                  }}
                />
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="ghost" onClick={() => setLessonModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={lessonSubmitting} disabled={lessonEditLoading}>
                {editingLesson ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
