import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ConsultationSessionService } from '@/api';
import { Button, Loading, IconEdit, IconTrash } from '@/components/ui';
import { toast } from '@/utils/toast';
import { useConfirm } from '@/utils/confirmDialog';
import { useLanguage } from '@/context/LanguageContext';

function unwrap(res, key = 'session') {
  return res?.[key] ?? res?.data ?? res ?? null;
}

function getDisplayName(row) {
  return row?.name ?? row?.translations?.ar?.name ?? row?.translations?.en?.name ?? row?.title ?? '—';
}

function getDisplayDesc(row) {
  return row?.description ?? row?.translations?.ar?.description ?? row?.translations?.en?.description ?? '—';
}

function getRelationName(obj) {
  if (!obj || typeof obj !== 'object') return '—';
  const name = obj.name ?? obj.title ?? obj.name_ar ?? obj.name_en ?? '';
  return String(name).trim() || '—';
}

export function ConsultationSessionSingle() {
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
        const res = await ConsultationSessionService.getById(id);
        const data = unwrap(res, 'session');
        if (!cancelled) setItem(data);
      } catch (err) {
        if (!cancelled) toast.error(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id, lang]);

  const handleDelete = async () => {
    const name = getDisplayName(item);
    const ok = await confirm({
      title: 'Delete consultation session',
      message: `Delete "${name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await ConsultationSessionService.remove(item.id);
      toast.success('Consultation session deleted');
      navigate('/consultation-sessions');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loading />;
  if (!item) return <div className="text-gray-500">Consultation session not found.</div>;

  const mentorName = getRelationName(item.mentor);
  const subCategoryName = getRelationName(item.sub_category);

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/consultation-sessions" className="text-[var(--color-accent)] hover:underline">
          ← Back to Consultation sessions
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">{getDisplayName(item)}</h1>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] overflow-hidden">
        <dl className="divide-y divide-[var(--color-border)]">
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-[var(--color-primary)]">{getDisplayName(item)}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-1 text-[var(--color-primary)] whitespace-pre-wrap">{getDisplayDesc(item)}</dd>
          </div>
          {item.content != null && item.content !== '' && (
            <div className="px-4 py-3">
              <dt className="text-sm font-medium text-gray-500">Content</dt>
              <dd className="mt-1 text-[var(--color-primary)] whitespace-pre-wrap">{item.content}</dd>
            </div>
          )}
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
          {(item.image_url || item.image) && (
            <div className="px-4 py-3">
              <dt className="text-sm font-medium text-gray-500">Image</dt>
              <dd className="mt-1">
                <img
                  src={item.image_url || item.image}
                  alt=""
                  className="max-w-xs rounded-[var(--radius)] border border-[var(--color-border)]"
                />
              </dd>
            </div>
          )}
          {item.price != null && (
            <div className="px-4 py-3">
              <dt className="text-sm font-medium text-gray-500">Price</dt>
              <dd className="mt-1 text-[var(--color-primary)]">{String(item.price)}</dd>
            </div>
          )}
          {item.duration != null && (
            <div className="px-4 py-3">
              <dt className="text-sm font-medium text-gray-500">Duration</dt>
              <dd className="mt-1 text-[var(--color-primary)]">{String(item.duration)}</dd>
            </div>
          )}
          {item.type != null && (
            <div className="px-4 py-3">
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-[var(--color-primary)]">{String(item.type)}</dd>
            </div>
          )}
          {item.earning_points != null && (
            <div className="px-4 py-3">
              <dt className="text-sm font-medium text-gray-500">Earning points</dt>
              <dd className="mt-1 text-[var(--color-primary)]">{String(item.earning_points)}</dd>
            </div>
          )}
          {subCategoryName !== '—' && (
            <div className="px-4 py-3">
              <dt className="text-sm font-medium text-gray-500">Sub-category</dt>
              <dd className="mt-1 text-[var(--color-primary)]">{subCategoryName}</dd>
            </div>
          )}
          {mentorName !== '—' && (
            <div className="px-4 py-3">
              <dt className="text-sm font-medium text-gray-500">Mentor</dt>
              <dd className="mt-1 text-[var(--color-primary)]">{mentorName}</dd>
            </div>
          )}
          {item.updated_at != null && (
            <div className="px-4 py-3">
              <dt className="text-sm font-medium text-gray-500">Updated at</dt>
              <dd className="mt-1 text-[var(--color-primary)]">{String(item.updated_at)}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="mt-4 flex gap-2">
        <Link to={`/consultation-sessions?edit=${item.id}`}>
          <Button variant="secondary" className="!p-2" title="Edit session" aria-label="Edit session">
            <IconEdit />
          </Button>
        </Link>
        <Button variant="danger" className="!p-2" title="Delete session" aria-label="Delete session" onClick={handleDelete}>
          <IconTrash />
        </Button>
      </div>
    </div>
  );
}

