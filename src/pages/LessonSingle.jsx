import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LessonService } from '@/api';
import { Button, Loading, IconTrash, IconEdit } from '@/components/ui';
import { toast } from '@/utils/toast';
import { useConfirm } from '@/utils/confirmDialog';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';

function localizedValue(val, lang) {
  if (val == null) return '—';
  if (typeof val === 'string') return val || '—';
  if (typeof val === 'object') return String(val?.[lang] ?? val?.en ?? val?.ar ?? '—');
  return String(val);
}

export function LessonSingle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { lang } = useLanguage();
  const { t } = useTranslation();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await LessonService.getById(id);
        const row = res?.lesson ?? res?.data?.lesson ?? res?.data ?? res ?? null;
        if (!cancelled) setItem(row && typeof row === 'object' ? row : null);
      } catch (err) {
        if (!cancelled) toast.error(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, lang]);

  const course = item?.course;
  const backTo = course?.id != null ? `/courses/${course.id}` : '/courses';
  const editTo = course?.id != null ? `/courses/${course.id}?lesson_edit=${item.id}` : null;

  const title = useMemo(() => {
    const raw = item?.title ?? item?.name ?? item?.label;
    return localizedValue(raw, lang);
  }, [item, lang]);

  const handleDelete = async () => {
    if (!item?.id) return;
    const ok = await confirm({
      title: t('lessons.deleteTitle', 'Delete lesson'),
      message: t('lessons.deleteMessage', 'Delete this lesson?'),
      confirmLabel: t('common.delete', 'Delete'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await LessonService.remove(item.id);
      toast.success(t('lessons.toasts.deleted', 'Lesson deleted'));
      navigate(backTo);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loading />;
  if (!item) return <div className="text-gray-500">{t('lessons.notFound', 'Lesson not found.')}</div>;

  const InfoRow = ({ label, children }) => (
    <div className="px-4 py-3">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-[var(--color-primary)]">{children}</dd>
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to={backTo} className="text-[var(--color-accent)] hover:underline">
          ← {t('lessons.backToCourse', 'Back to course')}
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">{title}</h1>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] overflow-hidden">
        <dl className="divide-y divide-[var(--color-border)]">
          <InfoRow label={t('lessons.columns.id', 'ID')}>{item.id}</InfoRow>
          <InfoRow label={t('lessons.columns.course', 'Course')}>
            {course?.id != null ? (
              <Link to={`/courses/${course.id}`} className="text-[var(--color-accent)] hover:underline">
                {localizedValue(course?.title ?? course?.name, lang)}
              </Link>
            ) : (
              '—'
            )}
          </InfoRow>
          <InfoRow label={t('lessons.columns.order', 'Order')}>{item.order ?? '—'}</InfoRow>
          <InfoRow label={t('lessons.columns.duration', 'Duration')}>
            {item.duration != null && item.duration !== '' ? `${item.duration}` : '—'}
          </InfoRow>
          <InfoRow label={t('lessons.columns.content', 'Content')}>
            <span className="whitespace-pre-wrap">{localizedValue(item.content, lang)}</span>
          </InfoRow>
          {item.video_url ? (
            <InfoRow label={t('lessons.columns.videoUrl', 'Video URL')}>
              <a
                href={item.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] hover:underline break-all"
              >
                {item.video_url}
              </a>
            </InfoRow>
          ) : null}
        </dl>
      </div>

      <div className="mt-4 flex gap-2">
        {editTo ? (
          <Link to={editTo}>
            <Button
              variant="secondary"
              className="!p-2"
              title={t('common.edit', 'Edit')}
              aria-label={t('common.edit', 'Edit')}
            >
              <IconEdit />
            </Button>
          </Link>
        ) : null}
        <Button
          variant="danger"
          className="!p-2"
          title={t('common.delete', 'Delete')}
          aria-label={t('common.delete', 'Delete')}
          onClick={handleDelete}
        >
          <IconTrash />
        </Button>
      </div>
    </div>
  );
}

