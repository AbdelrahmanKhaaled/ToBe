import { useEffect, useMemo, useState } from 'react';
import { AccessControlService, UserService } from '@/api';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

export function Users() {
  const { t } = useTranslation();

  const [submitting, setSubmitting] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [deductionType, setDeductionType] = useState('fixed');
  const [deductionValue, setDeductionValue] = useState('');

  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);
      try {
        const res = await AccessControlService.roles.listRoles();
        const list = Array.isArray(res?.data) ? res.data : res;
        setRoles(Array.isArray(list) ? list : []);
      } catch (err) {
        setRoles([]);
        toast.error(err.message || t('users.rolesLoadFailed'));
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchRoles();
  }, []);

  const allowedRoleOptions = useMemo(() => {
    const byName = new Map();
    for (const r of roles) {
      if (r?.name) byName.set(String(r.name), r);
    }
    const superAdmin = byName.get('super-admin') ?? null;
    const admin = byName.get('admin') ?? null;
    return [
      superAdmin && { id: String(superAdmin.id), name: 'super-admin' },
      admin && { id: String(admin.id), name: 'admin' },
    ].filter(Boolean);
  }, [roles]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoleId) {
      toast.error(t('users.rolesRequired'));
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name,
        email,
        phone_number: phoneNumber,
        bank_name: bankName,
        bank_account_name: bankAccountName,
        bank_account_number: bankAccountNumber,
        deduction_type: deductionType,
        deduction_value: deductionValue === '' ? null : Number(deductionValue),
        // Backend validation commonly expects role IDs: roles.* exists:roles,id
        roles: [selectedRoleId],
      };
      await UserService.create(payload);
      toast.success(t('users.created'));
      setSelectedRoleId('');
      setName('');
      setEmail('');
      setPhoneNumber('');
      setBankName('');
      setBankAccountName('');
      setBankAccountNumber('');
      setDeductionType('fixed');
      setDeductionValue('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">{t('users.title')}</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] p-5">
        <Input label={t('users.name')} value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label={t('users.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label={t('users.phoneNumber')} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />

        <div>
          <label className="text-sm font-medium text-[var(--color-primary)]">{t('users.roles')}</label>
          <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-white p-3">
            {loadingRoles ? (
              <div className="text-sm text-gray-500">{t('users.loadingRoles')}</div>
            ) : allowedRoleOptions.length ? (
              allowedRoleOptions.map((opt) => {
                const active = selectedRoleId === opt.id;
                const label =
                  opt.name === 'super-admin'
                    ? t('users.rolesOptions.superAdmin')
                    : t('users.rolesOptions.admin');
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedRoleId(opt.id)}
                    className={`px-3 py-2 rounded-xl border text-sm text-left transition-colors ${
                      active
                        ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                        : 'bg-white text-gray-700 border-[var(--color-border)] hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })
            ) : (
              <div className="text-sm text-gray-500">{t('users.noAllowedRoles')}</div>
            )}
          </div>
          <div className="mt-1 text-xs text-gray-500">{t('users.rolesSingleSelectHint')}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label={t('users.bankName')} value={bankName} onChange={(e) => setBankName(e.target.value)} required />
          <Input
            label={t('users.bankAccountName')}
            value={bankAccountName}
            onChange={(e) => setBankAccountName(e.target.value)}
            required
          />
        </div>

        <Input
          label={t('users.bankAccountNumber')}
          value={bankAccountNumber}
          onChange={(e) => setBankAccountNumber(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('users.deductionType')}</label>
            <select
              value={deductionType}
              onChange={(e) => setDeductionType(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-white"
            >
              <option value="fixed">{t('users.deductionTypes.fixed')}</option>
              <option value="percentage">{t('users.deductionTypes.percentage')}</option>
            </select>
          </div>
          <Input
            label={t('users.deductionValue')}
            type="number"
            value={deductionValue}
            onChange={(e) => setDeductionValue(e.target.value)}
            required
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={submitting}>
            {t('users.create')}
          </Button>
        </div>
      </form>
    </div>
  );
}

