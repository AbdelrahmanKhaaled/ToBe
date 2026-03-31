import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ConsultationRequestService } from '@/api';
import { Loading, IconArrowLeft } from '@/components/ui';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

function humanize(key) {
  const map = {
    type: 'Type',
    trainning_type: 'Training type',
    customer_needs: 'Customer needs',
    company_needs: 'Company needs',
    company_name: 'Company name',
    employees_num: 'Employees number',
    email: 'Email',
    phone_num: 'Phone',
    time_to_call: 'Time to call',
    location: 'Location',
    status: 'Status',
    created_at: 'Created at',
  };
  return map[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ConsultationRequestSingle() {
  const { t } = useTranslation();
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const res = await ConsultationRequestService.getById(id);
        if (!cancelled) setItem(res);
      } catch (err) {
        if (!cancelled) toast.error(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (id) run();
    return () => { cancelled = true; };
  }, [id]);

  const rows = useMemo(() => {
    const r = item && typeof item === 'object' ? item : {};
    const omit = new Set(['id', 'user_id']);
    const out = [];

    for (const key of Object.keys(r)) {
      if (omit.has(key)) continue;
      const value = r[key];
      if (value == null && (key === 'customer_needs' || key === 'company_needs')) continue;
      if (value == null) continue;
      out.push({ key, label: humanize(key), value });
    }

    // stable-ish ordering (important fields first)
    const order = [
      'type',
      'trainning_type',
      'company_name',
      'employees_num',
      'email',
      'phone_num',
      'time_to_call',
      'location',
      'customer_needs',
      'company_needs',
      'status',
      'created_at',
    ];
    out.sort((a, b) => {
      const ia = order.indexOf(a.key);
      const ib = order.indexOf(b.key);
      if (ia === -1 && ib === -1) return a.key.localeCompare(b.key);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    return out;
  }, [item]);

  if (loading && !item) return <Loading />;
  if (!item) return <div className="text-gray-500">Request not found.</div>;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link to="/consultation-requests" className="inline-flex items-center gap-2 text-[var(--color-accent)] hover:underline">
          <IconArrowLeft />
          {t('consultationRequests.title', 'Consultation requests')}
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">
        {t('consultationRequests.detailsTitle', 'Request details')}
      </h1>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] overflow-hidden">
        <dl className="divide-y divide-[var(--color-border)]">
          {rows.map((r) => (
            <div key={r.key} className="px-4 py-3">
              <dt className="text-sm font-medium text-gray-500">{r.label}</dt>
              <dd className="mt-1 text-[var(--color-primary)] whitespace-pre-wrap break-words">
                {String(r.value)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

