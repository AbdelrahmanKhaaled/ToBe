import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { PollService } from '@/api';
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

/** Same as list/edit: API options use `content` (plus id, count). */
function pollOptionText(x) {
  if (typeof x === 'string') return x;
  if (x && typeof x === 'object') {
    const v = x.content ?? x.label ?? x.title ?? x.text ?? x.option_text ?? x.name;
    return v != null ? String(v) : '';
  }
  return '';
}

export function PollSingle() {
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
        const poll = await PollService.getById(id);
        if (!cancelled) setItem(poll && typeof poll === 'object' ? poll : null);
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
      title: t('polls.deleteTitle', 'Delete poll'),
      message: t('polls.deleteMessage', 'Delete this poll?'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await PollService.remove(item.id);
      toast.success(t('polls.toasts.deleted', 'Poll deleted'));
      navigate('/polls');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loading />;
  if (!item) return <div className="text-gray-500">{t('polls.notFound', 'Poll not found.')}</div>;

  const course = item.course;
  const options = item.options ?? item.poll_options;
  const list = Array.isArray(options) ? options : [];

  const InfoRow = ({ label, children }) => (
    <div className="px-4 py-3">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-[var(--color-primary)]">{children}</dd>
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/polls" className="text-[var(--color-accent)] hover:underline">
          ← {t('polls.backToList', 'Back to polls')}
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">
        {t('polls.singleTitle', 'Poll')} #{item.id}
      </h1>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] overflow-hidden">
        <dl className="divide-y divide-[var(--color-border)]">
          <InfoRow label="ID">{item.id}</InfoRow>
          <InfoRow label={t('polls.columns.course', 'Course')}>
            {course ? (
              <Link to={`/courses/${course.id}`} className="text-[var(--color-accent)] hover:underline">
                {courseTitle(course)}
              </Link>
            ) : (
              '—'
            )}
          </InfoRow>
          <InfoRow label={t('polls.columns.visibility', 'Visibility')}>{item.visibility ?? '—'}</InfoRow>
          <InfoRow label={t('polls.columns.content', 'Content')}>
            <span className="whitespace-pre-wrap">{item.content ?? '—'}</span>
          </InfoRow>
          <InfoRow label={t('polls.columns.options', 'Options')}>
            {list.length === 0 ? (
              '—'
            ) : (
              <ol className="list-decimal list-inside space-y-2">
                {list.map((opt, idx) => {
                  const text = pollOptionText(opt);
                  const key = opt?.id ?? idx;
                  if (!text) {
                    return (
                      <li key={key} className="text-gray-400">
                        —
                      </li>
                    );
                  }
                  return (
                    <li key={key}>
                      <span>{text}</span>
                      {opt != null && typeof opt === 'object' && opt.count != null && opt.count !== '' ? (
                        <span className="ms-2 text-sm text-gray-500">
                          ({t('polls.optionVoteCount', '{{count}} votes', { count: String(opt.count) })})
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </InfoRow>
        </dl>
      </div>
      <div className="mt-4 flex gap-2">
        <Link to={`/polls?edit=${item.id}`}>
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
