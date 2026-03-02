import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CategoryService } from '@/api';
import { Button, Loading, IconEdit, IconTrash } from '@/components/ui';
import { toast } from '@/utils/toast';
import { useConfirm } from '@/utils/confirmDialog';

function unwrap(res, key = 'category') {
  return res?.[key] ?? res?.data ?? res ?? null;
}

function getDisplayName(row) {
  return row?.name ?? row?.translations?.ar?.name ?? row?.translations?.en?.name ?? '—';
}

function getDisplayDesc(row) {
  return row?.description ?? row?.translations?.ar?.description ?? row?.translations?.en?.description ?? '—';
}

export function CategorySingle() {
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
        const res = await CategoryService.getById(id);
        const data = unwrap(res, 'category');
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
    const name = getDisplayName(item);
    const ok = await confirm({
      title: 'Delete category',
      message: `Delete "${name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await CategoryService.remove(item.id);
      toast.success('Category deleted');
      navigate('/categories');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loading />;
  if (!item) return <div className="text-gray-500">Category not found.</div>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/categories" className="text-[var(--color-accent)] hover:underline">
          ← Back to Categories
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">{getDisplayName(item)}</h1>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] overflow-hidden">
        <dl className="divide-y divide-[var(--color-border)]">
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">ID</dt>
            <dd className="mt-1 text-[var(--color-primary)]">{item.id}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-[var(--color-primary)]">{getDisplayName(item)}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-1 text-[var(--color-primary)] whitespace-pre-wrap">{getDisplayDesc(item)}</dd>
          </div>
          {(item.image_url || item.image) && (
            <div className="px-4 py-3">
              <dt className="text-sm font-medium text-gray-500">Image</dt>
              <dd className="mt-1">
                <img src={item.image_url || item.image} alt="" className="max-w-xs rounded-[var(--radius)] border border-[var(--color-border)]" />
              </dd>
            </div>
          )}
        </dl>
      </div>
      <div className="mt-4 flex gap-2">
        <Link to={`/categories?edit=${item.id}`}>
          <Button variant="secondary" className="!p-2" title="Edit category" aria-label="Edit category">
            <IconEdit />
          </Button>
        </Link>
        <Button variant="danger" className="!p-2" title="Delete category" aria-label="Delete category" onClick={handleDelete}>
          <IconTrash />
        </Button>
      </div>
    </div>
  );
}
