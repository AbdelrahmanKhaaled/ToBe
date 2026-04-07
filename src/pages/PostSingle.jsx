import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { PostService } from '@/api';
import { Button, Loading, IconEdit, IconTrash } from '@/components/ui';
import { toast } from '@/utils/toast';
import { useConfirm } from '@/utils/confirmDialog';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';

function courseTitle(c) {
  if (!c) return '—';
  const t = c.title ?? c.name;
  if (t != null && typeof t === 'object') return String(t.ar ?? t.en ?? '');
  return String(t ?? c.id ?? '—');
}

function tagLabel(tag) {
  const n = tag?.name;
  if (n != null && typeof n === 'object') return String(n.ar ?? n.en ?? tag.id ?? '');
  return String(n ?? tag?.id ?? '');
}

export function PostSingle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { lang } = useLanguage();
  const { t } = useTranslation();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await PostService.getById(id);
        const post = data && typeof data === 'object' ? data.post ?? data : null;
        if (!cancelled) setItem(post);
      } catch (err) {
        if (!cancelled) toast.error(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (id) load();
    return () => { cancelled = true; };
  }, [id, lang]);

  const handleDelete = async () => {
    const ok = await confirm({
      title: t('posts.deleteTitle', 'Delete post'),
      message: t('posts.deleteMessage', 'Delete this post?'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await PostService.remove(item.id);
      toast.success(t('posts.toasts.deleted', 'Post deleted'));
      navigate('/posts');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loading />;
  if (!item) return <div className="text-gray-500">{t('posts.notFound', 'Post not found.')}</div>;

  const course = item.course;
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const images = item.images ?? item.post_images ?? [];

  const InfoRow = ({ label, children }) => (
    <div className="px-4 py-3">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-[var(--color-primary)]">{children}</dd>
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/posts" className="text-[var(--color-accent)] hover:underline">
          ← {t('posts.backToList', 'Back to posts')}
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">
        {t('posts.singleTitle', 'Post')} #{item.id}
      </h1>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] overflow-hidden">
        <dl className="divide-y divide-[var(--color-border)]">
          <InfoRow label="ID">{item.id}</InfoRow>
          <InfoRow label={t('posts.columns.course', 'Course')}>
            {course ? (
              <Link to={`/courses/${course.id}`} className="text-[var(--color-accent)] hover:underline">
                {courseTitle(course)}
              </Link>
            ) : (
              '—'
            )}
          </InfoRow>
          <InfoRow label={t('posts.columns.visibility', 'Visibility')}>{item.visibility ?? '—'}</InfoRow>
          <InfoRow label={t('posts.content', 'Content')}>
            <span className="whitespace-pre-wrap">{item.content ?? '—'}</span>
          </InfoRow>
          {tags.length > 0 && (
            <InfoRow label={t('posts.tags', 'Tags')}>
              <ul className="list-disc list-inside">
                {tags.map((tag) => (
                  <li key={tag.id ?? tagLabel(tag)}>{tagLabel(tag)}</li>
                ))}
              </ul>
            </InfoRow>
          )}
          {Array.isArray(images) && images.length > 0 && (
            <InfoRow label={t('posts.images', 'Images')}>
              <div className="flex flex-wrap gap-2">
                {images.map((img, idx) => {
                  const src = typeof img === 'string' ? img : (img?.url ?? img?.path ?? img?.image_url);
                  if (!src) return null;
                  return (
                    <img
                      key={idx}
                      src={src}
                      alt=""
                      className="max-w-[200px] rounded-[var(--radius)] border border-[var(--color-border)]"
                    />
                  );
                })}
              </div>
            </InfoRow>
          )}
        </dl>
      </div>
      <div className="mt-4 flex gap-2">
        <Link to={`/posts?edit=${item.id}`}>
          <Button
            variant="secondary"
            className="!p-2"
            title={t('common.edit')}
            aria-label={t('common.edit')}
          >
            <IconEdit />
          </Button>
        </Link>
        <Button
          variant="danger"
          className="!p-2"
          title={t('common.delete')}
          aria-label={t('common.delete')}
          onClick={handleDelete}
        >
          <IconTrash />
        </Button>
      </div>
    </div>
  );
}
