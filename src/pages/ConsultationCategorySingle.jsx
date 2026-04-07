import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ConsultationCategoryService } from '@/api';
import { Button, Loading, IconEdit, IconTrash } from '@/components/ui';
import { toast } from '@/utils/toast';
import { useConfirm } from '@/utils/confirmDialog';
import { useLanguage } from '@/context/LanguageContext';

function unwrap(res, key = 'category') {
  return res?.[key] ?? res?.data?.[key] ?? res?.data ?? res ?? null;
}

/** Resolve image URL (string or common nested shapes). */
function categoryImageUrl(item) {
  if (!item) return null;
  const img = item.image ?? item.image_url;
  if (typeof img === 'string' && img.trim()) return img;
  if (img && typeof img === 'object' && typeof img.url === 'string') return img.url;
  return null;
}

function localizedFromBilingual(field, lang) {
  if (field == null) return '—';
  if (typeof field === 'string') return field || '—';
  if (typeof field === 'object') {
    const v = field[lang] ?? field.en ?? field.ar;
    return v != null && String(v).trim() !== '' ? String(v) : '—';
  }
  return '—';
}

function titleForCategory(item, lang) {
  return localizedFromBilingual(item?.name, lang);
}

export function ConsultationCategorySingle() {
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
        const res = await ConsultationCategoryService.getById(id);
        const data = unwrap(res, 'category');
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
    const name = titleForCategory(item, lang);
    const ok = await confirm({
      title: 'Delete consultation category',
      message: `Delete "${name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await ConsultationCategoryService.remove(item.id);
      toast.success('Consultation category deleted');
      navigate('/consultation-categories');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loading />;
  if (!item) return <div className="text-gray-500">Consultation category not found.</div>;

  const subCategories = Array.isArray(item.sub_categories) ? item.sub_categories : [];
  const imgSrc = categoryImageUrl(item);

  const InfoRow = ({ label, children }) => (
    <div className="px-4 py-3">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-[var(--color-primary)]">{children}</dd>
    </div>
  );

  const nameObj = item.name && typeof item.name === 'object' ? item.name : null;
  const descObj = item.description && typeof item.description === 'object' ? item.description : null;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/consultation-categories" className="text-[var(--color-accent)] hover:underline">
          ← Back to Consultation categories
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">{titleForCategory(item, lang)}</h1>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] overflow-hidden">
        <dl className="divide-y divide-[var(--color-border)]">
          <InfoRow label="ID">{item.id}</InfoRow>

          {nameObj ? (
            <>
              <InfoRow label="Name (EN)">{nameObj.en != null && nameObj.en !== '' ? nameObj.en : '—'}</InfoRow>
              <InfoRow label="Name (AR)">{nameObj.ar != null && nameObj.ar !== '' ? nameObj.ar : '—'}</InfoRow>
            </>
          ) : (
            <InfoRow label="Name">{localizedFromBilingual(item.name, lang)}</InfoRow>
          )}

          {descObj ? (
            <>
              <InfoRow label="Description (EN)">
                <span className="whitespace-pre-wrap">{descObj.en != null && descObj.en !== '' ? descObj.en : '—'}</span>
              </InfoRow>
              <InfoRow label="Description (AR)">
                <span className="whitespace-pre-wrap">{descObj.ar != null && descObj.ar !== '' ? descObj.ar : '—'}</span>
              </InfoRow>
            </>
          ) : (
            <InfoRow label="Description">
              <span className="whitespace-pre-wrap">{localizedFromBilingual(item.description, lang)}</span>
            </InfoRow>
          )}

          {imgSrc ? (
            <InfoRow label="Image">
              <img src={imgSrc} alt="" className="max-w-xs rounded-[var(--radius)] border border-[var(--color-border)]" />
            </InfoRow>
          ) : (
            <InfoRow label="Image">
              <span className="text-gray-500">—</span>
            </InfoRow>
          )}

          <InfoRow label="Slug">{item.slug ?? '—'}</InfoRow>

          <InfoRow label="Sub-categories">
            {subCategories.length ? (
              <div className="space-y-1">
                {subCategories.map((sc) => {
                  const n = sc?.name;
                  const label =
                    n && typeof n === 'object'
                      ? (n[lang] ?? n.en ?? n.ar ?? `#${sc.id}`)
                      : (n != null && String(n) !== '' ? String(n) : `#${sc.id}`);
                  return (
                    <div key={sc.id}>
                      {sc?.id != null ? (
                        <Link
                          to={`/consultation-sub-categories/${sc.id}`}
                          className="text-[var(--color-accent)] hover:underline"
                        >
                          {label}
                        </Link>
                      ) : (
                        <span>{label}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="text-gray-500">—</span>
            )}
          </InfoRow>
        </dl>
      </div>

      <div className="mt-4 flex gap-2">
        <Link to={`/consultation-categories?edit=${item.id}`}>
          <Button variant="secondary" className="!p-2" title="Edit consultation category" aria-label="Edit consultation category">
            <IconEdit />
          </Button>
        </Link>
        <Button variant="danger" className="!p-2" title="Delete consultation category" aria-label="Delete consultation category" onClick={handleDelete}>
          <IconTrash />
        </Button>
      </div>
    </div>
  );
}
