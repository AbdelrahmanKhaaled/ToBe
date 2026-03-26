import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CategoryService } from '@/api';
import { Button, Loading, IconEdit, IconTrash } from '@/components/ui';
import { toast } from '@/utils/toast';
import { useConfirm } from '@/utils/confirmDialog';
import { useLanguage } from '@/context/LanguageContext';

function unwrap(res, key = 'category') {
  return res?.[key] ?? res?.data ?? res ?? null;
}

function getDisplayName(row) {
  if (!row) return '—';
  if (row?.name && typeof row.name === 'object') {
    return row.name?.en ?? row.name?.ar ?? '—';
  }
  return row?.name ?? row?.translations?.ar?.name ?? row?.translations?.en?.name ?? '—';
}

function getDisplayDesc(row) {
  if (!row) return '—';
  if (row?.description && typeof row.description === 'object') {
    return row.description?.en ?? row.description?.ar ?? '—';
  }
  return row?.description ?? row?.translations?.ar?.description ?? row?.translations?.en?.description ?? '—';
}

export function CategorySingle() {
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
  }, [id, lang]);

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

  const displayName = (() => {
    if (item?.name && typeof item.name === 'object') {
      return item.name?.[lang] ?? item.name?.en ?? item.name?.ar ?? '—';
    }
    return getDisplayName(item);
  })();

  const displayDesc = (() => {
    if (item?.description && typeof item.description === 'object') {
      return item.description?.[lang] ?? item.description?.en ?? item.description?.ar ?? '—';
    }
    return getDisplayDesc(item);
  })();

  const subCategories = Array.isArray(item?.sub_categories)
    ? item.sub_categories
    : Array.isArray(item?.subCategories)
      ? item.subCategories
      : [];

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/categories" className="text-[var(--color-accent)] hover:underline">
          ← Back to Categories
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">{displayName}</h1>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] overflow-hidden">
        <dl className="divide-y divide-[var(--color-border)]">
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">ID</dt>
            <dd className="mt-1 text-[var(--color-primary)]">{item.id}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-[var(--color-primary)]">{displayName}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-1 text-[var(--color-primary)] whitespace-pre-wrap">{displayDesc}</dd>
          </div>
          {(item.image_url || item.image) && (
            <div className="px-4 py-3">
              <dt className="text-sm font-medium text-gray-500">Image</dt>
              <dd className="mt-1">
                <img src={item.image_url || item.image} alt="" className="max-w-xs rounded-[var(--radius)] border border-[var(--color-border)]" />
              </dd>
            </div>
          )}
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Sub-categories</dt>
            <dd className="mt-2">
              {subCategories.length ? (
                <ul className="space-y-2">
                  {subCategories.map((sc) => {
                    const scName =
                      (sc?.name && typeof sc.name === 'object'
                        ? (sc.name?.[lang] ?? sc.name?.en ?? sc.name?.ar)
                        : sc?.name) ??
                      sc?.translations?.ar?.name ??
                      sc?.translations?.en?.name ??
                      `#${sc?.id ?? ''}`;

                    return (
                      <li key={sc?.id ?? scName} className="flex items-center justify-between gap-3">
                        {sc?.id != null ? (
                          <Link to={`/sub-categories/${sc.id}`} className="text-[var(--color-accent)] hover:underline">
                            {scName}
                          </Link>
                        ) : (
                          <span className="text-[var(--color-primary)]">{scName}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-sm text-gray-500">No sub-categories.</div>
              )}
            </dd>
          </div>
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
