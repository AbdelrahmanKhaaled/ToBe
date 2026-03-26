import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaqService } from '@/api';
import { Button, Loading, IconEdit, IconTrash } from '@/components/ui';
import { toast } from '@/utils/toast';
import { useConfirm } from '@/utils/confirmDialog';
import { useLanguage } from '@/context/LanguageContext';

function unwrap(res, key = 'faq') {
  return res?.[key] ?? res?.data ?? res ?? null;
}

function getQuestion(row) {
  return row?.question ?? row?.translations?.ar?.question ?? row?.translations?.en?.question ?? '—';
}

function getAnswer(row) {
  return row?.answer ?? row?.translations?.ar?.answer ?? row?.translations?.en?.answer ?? '—';
}

export function FaqSingle() {
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
        const res = await FaqService.getById(id);
        const data = unwrap(res, 'faq');
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
    const question = getQuestion(item);
    const ok = await confirm({
      title: 'Delete FAQ',
      message: `Delete this FAQ? "${question.slice(0, 50)}${question.length > 50 ? '...' : ''}" This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await FaqService.remove(item.id);
      toast.success('FAQ deleted');
      navigate('/faqs');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loading />;
  if (!item) return <div className="text-gray-500">FAQ not found.</div>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/faqs" className="text-[var(--color-accent)] hover:underline">
          ← Back to FAQs
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">FAQ #{item.id}</h1>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] overflow-hidden">
        <dl className="divide-y divide-[var(--color-border)]">
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">ID</dt>
            <dd className="mt-1 text-[var(--color-primary)]">{item.id}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Question</dt>
            <dd className="mt-1 text-[var(--color-primary)]">{getQuestion(item)}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Answer</dt>
            <dd className="mt-1 text-[var(--color-primary)] whitespace-pre-wrap">{getAnswer(item)}</dd>
          </div>
        </dl>
      </div>
      <div className="mt-4 flex gap-2">
        <Link to={`/faqs?edit=${item.id}`}>
          <Button variant="secondary" className="!p-2" title="Edit FAQ" aria-label="Edit FAQ">
            <IconEdit />
          </Button>
        </Link>
        <Button variant="danger" className="!p-2" title="Delete FAQ" aria-label="Delete FAQ" onClick={handleDelete}>
          <IconTrash />
        </Button>
      </div>
    </div>
  );
}
