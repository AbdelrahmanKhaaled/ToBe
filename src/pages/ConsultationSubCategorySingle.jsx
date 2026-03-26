import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ConsultationSubCategoryService } from '@/api';
import { Button, Loading, IconEdit, IconTrash } from '@/components/ui';
import { toast } from '@/utils/toast';
import { useConfirm } from '@/utils/confirmDialog';
import { useLanguage } from '@/context/LanguageContext';

function unwrap(res, key = 'sub_category') {
  return res?.[key] ?? res?.data ?? res ?? null;
}

function getDisplayName(row) {
  return row?.name ?? row?.translations?.ar?.name ?? row?.translations?.en?.name ?? '—';
}

function getDisplayDesc(row) {
  return row?.description ?? row?.translations?.ar?.description ?? row?.translations?.en?.description ?? '—';
}

export function ConsultationSubCategorySingle() {
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
        const res = await ConsultationSubCategoryService.getById(id);
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
      title: 'Delete consultation sub-category',
      message: `Delete "${name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await ConsultationSubCategoryService.remove(item.id);
      toast.success('Consultation sub-category deleted');
      navigate('/consultation-sub-categories');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loading />;
  if (!item) return <div className="text-gray-500">Consultation sub-category not found.</div>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/consultation-sub-categories" className="text-[var(--color-accent)] hover:underline">
          ← Back to Consultation sub-categories
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
        </dl>
      </div>

      <div className="mt-4 flex gap-2">
        <Link to={`/consultation-sub-categories?edit=${item.id}`}>
          <Button variant="secondary" className="!p-2" title="Edit" aria-label="Edit">
            <IconEdit />
          </Button>
        </Link>
        <Button variant="danger" className="!p-2" title="Delete" aria-label="Delete" onClick={handleDelete}>
          <IconTrash />
        </Button>
      </div>
    </div>
  );
}

