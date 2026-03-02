import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { LessonService } from '@/api';
import { Button, Loading, IconEdit, IconTrash } from '@/components/ui';
import { toast } from '@/utils/toast';
import { useConfirm } from '@/utils/confirmDialog';
import { LessonVideoUploader } from '@/components/VideoChunkUploader';

function unwrap(res, key = 'lesson') {
  return res?.[key] ?? res?.data ?? res ?? null;
}

function getTitle(row) {
  if (!row) return '—';
  const t = row.title;
  if (t != null && typeof t === 'object') return t.en ?? t.ar ?? '—';
  return row.title ?? row.translations?.ar?.title ?? row.translations?.en?.title ?? '—';
}

function getContent(row) {
  if (!row) return '—';
  const c = row.content;
  if (c != null && typeof c === 'object') return c.en ?? c.ar ?? '—';
  return row.content ?? row.translations?.ar?.content ?? row.translations?.en?.content ?? '—';
}

function getRelationName(obj) {
  if (obj == null || typeof obj !== 'object') return '—';
  const n = obj.name ?? obj.title;
  if (typeof n === 'string') return n;
  if (n && typeof n === 'object') return n.en ?? n.ar ?? '—';
  return '—';
}

export function LessonSingle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await LessonService.getById(id);
        const data = unwrap(res, 'lesson');
        if (!cancelled) setItem(data);
      } catch (err) {
        if (!cancelled) toast.error(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (id) load();
    return () => { cancelled = true; };
  }, [id]);

  const handleDelete = async () => {
    const title = getTitle(item);
    const ok = await confirm({
      title: 'Delete lesson',
      message: `Delete "${title}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await LessonService.remove(item.id);
      toast.success('Lesson deleted');
      navigate('/lessons');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loading />;
  if (!item) return <div className="text-gray-500">Lesson not found.</div>;

  const course = item.course && typeof item.course === 'object' ? item.course : null;
  const isRecordedCourse = course?.type === 'recorded';

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/lessons" className="text-[var(--color-accent)] hover:underline">
          ← Back to Lessons
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">{getTitle(item)}</h1>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] overflow-hidden">
        <dl className="divide-y divide-[var(--color-border)]">
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">ID</dt>
            <dd className="mt-1 text-[var(--color-primary)]">{item.id}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Title</dt>
            <dd className="mt-1 text-[var(--color-primary)]">{getTitle(item)}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Course</dt>
            <dd className="mt-1 text-[var(--color-primary)]">
              {course?.id != null ? (
                <Link to={`/courses/${course.id}`} className="text-[var(--color-accent)] hover:underline">
                  {getRelationName(course)}
                </Link>
              ) : (
                getRelationName(course) || (item.course_id ?? item.courseId ?? '—')
              )}
            </dd>
          </div>
          {course?.category?.id != null && (
            <div className="px-4 py-3">
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1">
                <Link to={`/categories/${course.category.id}`} className="text-[var(--color-accent)] hover:underline">
                  {getRelationName(course.category)}
                </Link>
              </dd>
            </div>
          )}
          {course?.level?.id != null && (
            <div className="px-4 py-3">
              <dt className="text-sm font-medium text-gray-500">Level</dt>
              <dd className="mt-1">
                <Link to={`/levels/${course.level.id}`} className="text-[var(--color-accent)] hover:underline">
                  {getRelationName(course.level)}
                </Link>
              </dd>
            </div>
          )}
          {course?.mentor?.id != null && (
            <div className="px-4 py-3">
              <dt className="text-sm font-medium text-gray-500">Mentor</dt>
              <dd className="mt-1">
                <Link to={`/mentors/${course.mentor.id}`} className="text-[var(--color-accent)] hover:underline">
                  {getRelationName(course.mentor)}
                </Link>
              </dd>
            </div>
          )}
          {(item.order != null && item.order !== '') && (
            <div className="px-4 py-3">
              <dt className="text-sm font-medium text-gray-500">Order</dt>
              <dd className="mt-1 text-[var(--color-primary)]">{item.order}</dd>
            </div>
          )}
          {(item.duration != null && item.duration !== '') && (
            <div className="px-4 py-3">
              <dt className="text-sm font-medium text-gray-500">Duration</dt>
              <dd className="mt-1 text-[var(--color-primary)]">{item.duration} min</dd>
            </div>
          )}
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Content</dt>
            <dd className="mt-1 text-[var(--color-primary)] whitespace-pre-wrap">{getContent(item)}</dd>
          </div>
          {item.video_url && (
            <div className="px-4 py-3">
              <dt className="text-sm font-medium text-gray-500">Video URL</dt>
              <dd className="mt-1">
                <a
                  href={item.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent)] hover:underline break-all"
                >
                  {item.video_url}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>
      {isRecordedCourse && (
        <div className="mt-4 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] p-4">
          <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-2">
            Upload / Replace lesson video
          </h2>
          <p className="text-xs text-gray-600 mb-2">
            Upload a video file for this recorded lesson. Large files will be uploaded in chunks.
          </p>
          <LessonVideoUploader
            lessonId={item.id}
            onComplete={(url) => {
              setItem((prev) => (prev ? { ...prev, video_url: url } : prev));
            }}
          />
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <Link to={`/lessons?edit=${item.id}`}>
          <Button variant="secondary" className="!p-2" title="Edit lesson" aria-label="Edit lesson">
            <IconEdit />
          </Button>
        </Link>
        <Button variant="danger" className="!p-2" title="Delete lesson" aria-label="Delete lesson" onClick={handleDelete}>
          <IconTrash />
        </Button>
      </div>
    </div>
  );
}
