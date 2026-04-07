import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ConsultationSubCategoryService } from '@/api';
import { Button, Loading, IconEdit, IconTrash } from '@/components/ui';
import { toast } from '@/utils/toast';
import { useConfirm } from '@/utils/confirmDialog';
import { useLanguage } from '@/context/LanguageContext';

function unwrap(res, key = 'sub_category') {
  return res?.[key] ?? res?.data?.[key] ?? res?.data ?? res ?? null;
}

function subCategoryImageUrl(item) {
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

function titleForSubCategory(item, lang) {
  return localizedFromBilingual(item?.name, lang);
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
    const name = titleForSubCategory(item, lang);
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

  const category = item.category && typeof item.category === 'object' ? item.category : null;
  const categoryId = category?.id ?? item.consultation_category_id;
  const categoryNameResolved = category ? localizedFromBilingual(category.name, lang) : null;
  const categoryLinkLabel =
    categoryNameResolved && categoryNameResolved !== '—'
      ? categoryNameResolved
      : categoryId != null && categoryId !== ''
        ? `#${categoryId}`
        : '—';

  const sessions = Array.isArray(item.sessions) ? item.sessions : [];
  const imgSrc = subCategoryImageUrl(item);

  const nameObj = item.name && typeof item.name === 'object' ? item.name : null;
  const descObj = item.description && typeof item.description === 'object' ? item.description : null;

  const InfoRow = ({ label, children }) => (
    <div className="px-4 py-3">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-[var(--color-primary)]">{children}</dd>
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/consultation-sub-categories" className="text-[var(--color-accent)] hover:underline">
          ← Back to Consultation sub-categories
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">{titleForSubCategory(item, lang)}</h1>

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

          <InfoRow label="Category">
            {categoryId != null && categoryId !== '' ? (
              <Link
                to={`/consultation-categories/${categoryId}`}
                className="text-[var(--color-accent)] hover:underline"
              >
                {categoryLinkLabel}
              </Link>
            ) : (
              <span>{categoryLinkLabel}</span>
            )}
          </InfoRow>

          <InfoRow label="Sessions">
            {sessions.length ? (
              <div className="space-y-1">
                {sessions.map((s) => {
                  const label = localizedFromBilingual(s?.name, lang);
                  return (
                    <div key={s.id}>
                      {s?.id != null ? (
                        <Link
                          to={`/consultation-sessions/${s.id}`}
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
