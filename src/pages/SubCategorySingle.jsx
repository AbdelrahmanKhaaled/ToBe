import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { SubCategoryService } from '@/api';
import { Button, Loading, IconEdit, IconTrash } from '@/components/ui';
import { toast } from '@/utils/toast';
import { useConfirm } from '@/utils/confirmDialog';
import { useLanguage } from '@/context/LanguageContext';

function unwrap(res, key = 'sub_category') {
  return res?.[key] ?? res?.data ?? res ?? null;
}

function getDisplayName(row) {
  if (!row) return '—';
  if (row?.name && typeof row.name === 'object') return row.name?.en ?? row.name?.ar ?? '—';
  return row?.name ?? row?.translations?.ar?.name ?? row?.translations?.en?.name ?? '—';
}

function getDisplayDesc(row) {
  if (!row) return '—';
  if (row?.description && typeof row.description === 'object') return row.description?.en ?? row.description?.ar ?? '—';
  return row?.description ?? row?.translations?.ar?.description ?? row?.translations?.en?.description ?? '—';
}

function getNameByLang(row, lang) {
  if (!row) return '—';
  if (row?.name && typeof row.name === 'object') return row.name?.[lang] ?? row.name?.en ?? row.name?.ar ?? '—';
  return row?.name ?? row?.translations?.ar?.name ?? row?.translations?.en?.name ?? '—';
}

function getDescByLang(row, lang) {
  if (!row) return '—';
  if (row?.description && typeof row.description === 'object') return row.description?.[lang] ?? row.description?.en ?? row.description?.ar ?? '—';
  return row?.description ?? row?.translations?.ar?.description ?? row?.translations?.en?.description ?? '—';
}

export function SubCategorySingle() {
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
        const res = await SubCategoryService.getById(id);
        const data = unwrap(res, 'sub_category');
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
      title: 'Delete sub-category',
      message: `Delete "${name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await SubCategoryService.remove(item.id);
      toast.success('Sub-category deleted');
      navigate('/sub-categories');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loading />;
  if (!item) return <div className="text-gray-500">Sub-category not found.</div>;

  const category = item.category && typeof item.category === 'object' ? item.category : null;
  const courses = Array.isArray(item.courses) ? item.courses : [];

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/sub-categories" className="text-[var(--color-accent)] hover:underline">
          ← Back to Sub-categories
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">{getNameByLang(item, lang)}</h1>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] overflow-hidden">
        <dl className="divide-y divide-[var(--color-border)]">
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-[var(--color-primary)]">{getNameByLang(item, lang)}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-1 text-[var(--color-primary)] whitespace-pre-wrap">{getDescByLang(item, lang)}</dd>
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
            <dt className="text-sm font-medium text-gray-500">Category</dt>
            <dd className="mt-1 text-[var(--color-primary)]">
              {category?.id != null ? (
                <Link to={`/categories/${category.id}`} className="text-[var(--color-accent)] hover:underline">
                  {getNameByLang(category, lang)}
                </Link>
              ) : (
                <span>{item.category_id ?? '—'}</span>
              )}
            </dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Courses</dt>
            <dd className="mt-2">
              {courses.length ? (
                <ul className="space-y-2">
                  {courses.map((c) => {
                    const courseName =
                      (c?.name && typeof c.name === 'object'
                        ? (c.name?.[lang] ?? c.name?.en ?? c.name?.ar)
                        : c?.name) ??
                      c?.translations?.ar?.name ??
                      c?.translations?.en?.name ??
                      `#${c?.id ?? ''}`;
                    return (
                      <li key={c?.id ?? courseName}>
                        {c?.id != null ? (
                          <Link to={`/courses/${c.id}`} className="text-[var(--color-accent)] hover:underline">
                            {courseName}
                          </Link>
                        ) : (
                          <span>{courseName}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-sm text-gray-500">No courses.</div>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 flex gap-2">
        <Link to={`/sub-categories?edit=${item.id}`}>
          <Button variant="secondary" className="!p-2" title="Edit sub-category" aria-label="Edit sub-category">
            <IconEdit />
          </Button>
        </Link>
        <Button variant="danger" className="!p-2" title="Delete sub-category" aria-label="Delete sub-category" onClick={handleDelete}>
          <IconTrash />
        </Button>
      </div>
    </div>
  );
}

