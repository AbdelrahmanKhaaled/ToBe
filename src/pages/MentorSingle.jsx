import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MentorService } from '@/api';
import { Button, Loading, IconEdit, IconTrash } from '@/components/ui';
import { toast } from '@/utils/toast';
import { useConfirm } from '@/utils/confirmDialog';
import { getStoredMentorPhone } from '@/utils/mentorPhoneStorage';
import { useLanguage } from '@/context/LanguageContext';

function unwrap(res, key = 'mentor') {
  return res?.[key] ?? res?.data ?? res ?? null;
}

function getPhone(row) {
  if (!row) return '';
  const fromApi =
    row.phone_number ??
    row.phone ??
    row.mobile ??
    row.tel ??
    row.contact_number ??
    row.user?.phone_number ??
    row.user?.phone ??
    row.user?.mobile ??
    row.profile?.phone_number ??
    row.profile?.phone ??
    '';
  if (fromApi) return fromApi;
  const id = row.id;
  if (id != null) return getStoredMentorPhone(id);
  return '';
}

export function MentorSingle() {
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
        const res = await MentorService.getById(id);
        const data = unwrap(res, 'mentor');
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
    const name = item.name ?? 'this mentor';
    const ok = await confirm({
      title: 'Delete mentor',
      message: `Delete "${name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await MentorService.remove(item.id);
      toast.success('Mentor deleted');
      navigate('/mentors');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loading />;
  if (!item) return <div className="text-gray-500">Mentor not found.</div>;
  const detail = item?.mentor_detail ?? item?.mentorDetail ?? null;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/mentors" className="text-[var(--color-accent)] hover:underline">
          ← Back to Mentors
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">{item.name ?? '—'}</h1>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] overflow-hidden">
        <dl className="divide-y divide-[var(--color-border)]">
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-[var(--color-primary)]">{item.name ?? '—'}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-[var(--color-primary)]">{item.email ?? '—'}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Phone</dt>
            <dd className="mt-1 text-[var(--color-primary)]">{getPhone(item) || '—'}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Wallet balance</dt>
            <dd className="mt-1 text-[var(--color-primary)]">{item?.wallet_balance?.balance ?? item?.walletBalance?.balance ?? '0.00'}</dd>
          </div>
          {detail && (
            <>
              <div className="px-4 py-3">
                <dt className="text-sm font-medium text-gray-500">Deduction type</dt>
                <dd className="mt-1 text-[var(--color-primary)]">{detail.deduction_type ?? '—'}</dd>
              </div>
              <div className="px-4 py-3">
                <dt className="text-sm font-medium text-gray-500">Deduction value</dt>
                <dd className="mt-1 text-[var(--color-primary)]">{detail.deduction_value ?? '—'}</dd>
              </div>
              <div className="px-4 py-3">
                <dt className="text-sm font-medium text-gray-500">Bank name</dt>
                <dd className="mt-1 text-[var(--color-primary)]">{detail.bank_name ?? '—'}</dd>
              </div>
              <div className="px-4 py-3">
                <dt className="text-sm font-medium text-gray-500">Bank account number</dt>
                <dd className="mt-1 text-[var(--color-primary)]">{detail.bank_account_number ?? '—'}</dd>
              </div>
              <div className="px-4 py-3">
                <dt className="text-sm font-medium text-gray-500">Bank account name</dt>
                <dd className="mt-1 text-[var(--color-primary)]">{detail.bank_account_name ?? '—'}</dd>
              </div>
              <div className="px-4 py-3">
                <dt className="text-sm font-medium text-gray-500">Bank account IBAN</dt>
                <dd className="mt-1 text-[var(--color-primary)]">{detail.bank_account_iban ?? '—'}</dd>
              </div>
              <div className="px-4 py-3">
                <dt className="text-sm font-medium text-gray-500">Bank account SWIFT</dt>
                <dd className="mt-1 text-[var(--color-primary)]">{detail.bank_account_swift ?? '—'}</dd>
              </div>
              <div className="px-4 py-3">
                <dt className="text-sm font-medium text-gray-500">Bank account routing number</dt>
                <dd className="mt-1 text-[var(--color-primary)]">{detail.bank_account_routing_number ?? '—'}</dd>
              </div>
              <div className="px-4 py-3">
                <dt className="text-sm font-medium text-gray-500">Bank account branch code</dt>
                <dd className="mt-1 text-[var(--color-primary)]">{detail.bank_account_branch_code ?? '—'}</dd>
              </div>
            </>
          )}
        </dl>
      </div>
      <div className="mt-4 flex gap-2">
        <Link to={`/mentors?edit=${item.id}`}>
          <Button variant="secondary" className="!p-2" title="Edit mentor" aria-label="Edit mentor">
            <IconEdit />
          </Button>
        </Link>
        <Button variant="danger" className="!p-2" title="Delete mentor" aria-label="Delete mentor" onClick={handleDelete}>
          <IconTrash />
        </Button>
      </div>
    </div>
  );
}
