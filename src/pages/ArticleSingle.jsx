import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArticleService } from '@/api';
import { Button, Loading, IconEdit, IconTrash } from '@/components/ui';
import { toast } from '@/utils/toast';
import { useConfirm } from '@/utils/confirmDialog';
import { useLanguage } from '@/context/LanguageContext';

function getTitle(row) {
  const t = row?.title;
  if (t != null && typeof t === 'object') return t.ar ?? t.en ?? row?.searchable_title ?? '—';
  return t ?? row?.title_ar ?? row?.title_en ?? row?.searchable_title ?? row?.translations?.ar?.title ?? row?.translations?.en?.title ?? '—';
}

function getContent(row) {
  return row?.content ?? row?.translations?.ar?.content ?? row?.translations?.en?.content ?? '—';
}

export function ArticleSingle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { lang } = useLanguage();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await ArticleService.getById(id);
        if (!cancelled) setItem(data ?? null);
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
    const title = getTitle(item);
    const ok = await confirm({
      title: 'Delete article',
      message: `Delete "${title}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await ArticleService.remove(item.id);
      toast.success('Article deleted');
      navigate('/articles');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loading />;
  if (!item) return <div className="text-gray-500">Article not found.</div>;

  const published = item.is_published === true || item.is_published === 1;
  const accepted = item.accepted === true || item.accepted === 1;
  const course = item.course;
  const user = item.user;
  const mentor = course?.mentor;

  const InfoRow = ({ label, children }) => (
    <div className="px-4 py-3">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-[var(--color-primary)]">{children}</dd>
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/articles" className="text-[var(--color-accent)] hover:underline">
          ← Back to Articles
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">{getTitle(item) || 'Untitled'}</h1>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] overflow-hidden">
        <dl className="divide-y divide-[var(--color-border)]">
          <InfoRow label="ID">{item.id}</InfoRow>
          <InfoRow label="Title">{getTitle(item) || '—'}</InfoRow>
          {(item.image_url || item.image) && (
            <InfoRow label="Image">
              <img src={item.image_url || item.image} alt="" className="max-w-xs rounded-[var(--radius)] border border-[var(--color-border)]" />
            </InfoRow>
          )}
          <InfoRow label="Content">
            <span className="whitespace-pre-wrap">{getContent(item)}</span>
          </InfoRow>
          <InfoRow label="Course">
            {course ? (
              <Link to={`/courses/${course.id}`} className="text-[var(--color-accent)] hover:underline">
                {course.name}
              </Link>
            ) : (
              '—'
            )}
          </InfoRow>
          <InfoRow label="User (Author)">
            {user?.name ?? '—'}
          </InfoRow>
          <InfoRow label="Mentor">
            {mentor ? (
              <Link to={`/mentors/${mentor.id}`} className="text-[var(--color-accent)] hover:underline">
                {mentor.name}
              </Link>
            ) : (
              '—'
            )}
          </InfoRow>
          {course?.category && (
            <InfoRow label="Category">{course.category.name}</InfoRow>
          )}
          {course?.level && (
            <InfoRow label="Level">{course.level.name}</InfoRow>
          )}
          <InfoRow label="Earning points">{item.earning_points ?? '0'}</InfoRow>
          <InfoRow label="Published">
            <span className={`px-2 py-1 rounded text-sm ${published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {published ? 'Yes' : 'Draft'}
            </span>
          </InfoRow>
          <InfoRow label="Accepted">
            <span className={`px-2 py-1 rounded text-sm ${accepted ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
              {accepted ? 'Yes' : 'Pending'}
            </span>
          </InfoRow>
        </dl>
      </div>
      <div className="mt-4 flex gap-2">
        <Link to={`/articles?edit=${item.id}`}>
          <Button variant="secondary" className="!p-2" title="Edit article" aria-label="Edit article">
            <IconEdit />
          </Button>
        </Link>
        <Button variant="danger" className="!p-2" title="Delete article" aria-label="Delete article" onClick={handleDelete}>
          <IconTrash />
        </Button>
      </div>
    </div>
  );
}
