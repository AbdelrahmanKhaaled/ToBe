import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessControlService, UserService } from '@/api';
import { Button, DataTable, IconEdit, IconTrash, Input, Loading, Modal } from '@/components/ui';
import { useConfirm } from '@/utils/confirmDialog';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

function normalizeListItem(row, idx, fallbackPage) {
  const id = row?.id ?? row?.user_id ?? row?.userId ?? row?._id ?? `${fallbackPage}-${idx}`;
  return { ...row, id: id != null ? String(id) : `${fallbackPage}-${idx}` };
}

function extractRoleNames(rolesRaw) {
  if (!rolesRaw) return [];
  const arr = Array.isArray(rolesRaw) ? rolesRaw : [rolesRaw];
  return arr
    .map((r) => {
      if (!r) return null;
      if (typeof r === 'string') return r;
      if (typeof r === 'number') return String(r);
      return r?.name ?? null;
    })
    .filter(Boolean);
}

function extractRoleId(rolesRaw) {
  if (!rolesRaw) return null;
  const arr = Array.isArray(rolesRaw) ? rolesRaw : [rolesRaw];
  const first = arr[0];
  if (!first) return null;
  if (typeof first === 'string' || typeof first === 'number') return String(first);
  if (first?.id != null) return String(first.id);
  if (first?.pivot?.role_id != null) return String(first.pivot.role_id);
  return null;
}

function extractPermissionIds(permsRaw) {
  if (!permsRaw) return [];
  if (Array.isArray(permsRaw)) {
    return permsRaw
      .map((p) => {
        if (p == null) return null;
        if (typeof p === 'string' || typeof p === 'number') return String(p);
        return p?.id != null ? String(p.id) : p?.permission_id != null ? String(p.permission_id) : null;
      })
      .filter(Boolean);
  }
  return [];
}

export function Users() {
  const { t } = useTranslation();
  const confirm = useConfirm();

  // List
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Lookup lists (roles, permissions)
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [roles, setRoles] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [permissions, setPermissions] = useState([]);

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

  // Modal + form
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);

  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [deductionType, setDeductionType] = useState('fixed');
  const [deductionValue, setDeductionValue] = useState('');

  const resetForm = useCallback(() => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPhoneNumber('');
    setSelectedRoleId('');
    setSelectedPermissionIds([]);
    setBankName('');
    setBankAccountName('');
    setBankAccountNumber('');
    setDeductionType('fixed');
    setDeductionValue('');
  }, []);

  const fetchRoles = useCallback(async () => {
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
  }, [t]);

  const fetchPermissions = useCallback(async () => {
    setLoadingPermissions(true);
    try {
      const res = await AccessControlService.permissions.listPermissions();
      const list = Array.isArray(res?.data) ? res.data : res;
      setPermissions(Array.isArray(list) ? list : []);
    } catch (err) {
      setPermissions([]);
      // no dedicated i18n key: fallback to generic
      toast.error(err.message || 'Failed to load permissions');
    } finally {
      setLoadingPermissions(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await UserService.getAll({ search: search || undefined, page, per_page: 10 });
      const rows = Array.isArray(res?.data) ? res.data : [];
      setData(rows.map((row, idx) => normalizeListItem(row, idx, page)));
      setMeta(res?.meta ?? null);
    } catch (err) {
      toast.error(err.message);
      setData([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchByUrl = useCallback(async (url) => {
    setLoading(true);
    try {
      const res = await UserService.getPageByUrl(url);
      if (!res) return;
      const rows = Array.isArray(res?.data) ? res.data : [];
      setData(rows.map((row, idx) => normalizeListItem(row, idx, page)));
      setMeta(res?.meta ?? null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (row) => {
    const roleId = extractRoleId(row?.roles ?? row?.role ?? row?.user_roles);
    const permIds = extractPermissionIds(row?.permissions ?? row?.permission_ids ?? row?.user_permissions);

    setEditingId(row.id);
    setName(row.name ?? '');
    setEmail(row.email ?? '');
    setPhoneNumber(row.phone_number ?? row.phoneNumber ?? '');
    setSelectedRoleId(roleId ?? '');
    setSelectedPermissionIds(permIds);

    setBankName(row.bank_name ?? row.bankName ?? '');
    setBankAccountName(row.bank_account_name ?? row.bankAccountName ?? '');
    setBankAccountNumber(row.bank_account_number ?? row.bankAccountNumber ?? '');
    setDeductionType(row.deduction_type ?? row.deductionType ?? 'fixed');
    setDeductionValue(
      row.deduction_value != null ? String(row.deduction_value) : row.deductionValue != null ? String(row.deductionValue) : ''
    );

    setModalOpen(true);
  };

  const togglePermission = (permId) => {
    const id = String(permId);
    setSelectedPermissionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e) => {
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
        phone_number: phoneNumber === '' ? null : phoneNumber,
        roles: [selectedRoleId],
        permissions: selectedPermissionIds,
        bank_name: bankName,
        bank_account_name: bankAccountName,
        bank_account_number: bankAccountNumber,
        deduction_type: deductionType,
        deduction_value: deductionValue === '' ? null : Number(deductionValue),
      };

      if (editingId) {
        await UserService.update(editingId, payload);
        toast.success(t('users.updated'));
      } else {
        await UserService.create(payload);
        toast.success(t('users.created'));
      }

      setModalOpen(false);
      resetForm();
      await fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    const ok = await confirm({
      title: t('users.deleteTitle'),
      message: t('users.deleteMessage'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await UserService.remove(row.id);
      toast.success(t('users.deleted'));
      await fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading && !data.length) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">{t('users.title')}</h1>
        <Button onClick={openCreate}>{t('users.create')}</Button>
      </div>

      <DataTable
        columns={[
          { key: 'name', header: t('users.name'), render: (r) => r.name ?? '—' },
          { key: 'email', header: t('users.email'), render: (r) => r.email ?? '—' },
          {
            key: 'phone_number',
            header: t('users.phoneNumber'),
            render: (r) => r.phone_number ?? r.phoneNumber ?? '—',
          },
          {
            key: 'roles',
            header: t('users.roles'),
            render: (r) => extractRoleNames(r.roles ?? r.role ?? []).join(', ') || '—',
          },
        ]}
        data={data}
        meta={meta ?? undefined}
        onPageChange={(pageNum, linkUrl) => (linkUrl ? fetchByUrl(linkUrl) : setPage(pageNum))}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        emptyMessage={t('users.empty')}
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" className="!p-2 min-w-0" title={t('common.edit')} aria-label="Edit" onClick={() => openEdit(row)}>
              <IconEdit />
            </Button>
            <Button variant="danger" className="!p-2 min-w-0" title={t('common.delete')} aria-label="Delete" onClick={() => handleDelete(row)}>
              <IconTrash />
            </Button>
          </div>
        )}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? t('common.edit') : t('common.create')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label={t('users.name')} value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label={t('users.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <Input label={t('users.phoneNumber')} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />

          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('users.roles')}</label>
            <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-white p-3">
              {loadingRoles ? (
                <div className="text-sm text-gray-500">{t('users.loadingRoles')}</div>
              ) : allowedRoleOptions.length ? (
                allowedRoleOptions.map((opt) => {
                  const active = String(selectedRoleId) === String(opt.id);
                  const label =
                    opt.name === 'super-admin' ? t('users.rolesOptions.superAdmin') : t('users.rolesOptions.admin');

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

          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">{t('users.permissions')}</label>
            {loadingPermissions ? (
              <div className="text-sm text-gray-500 mt-2">{t('users.loadingPermissions')}</div>
            ) : permissions.length ? (
              <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-white p-3">
                {permissions.map((p) => {
                  const pid = String(p.id);
                  const checked = selectedPermissionIds.includes(pid);
                  const label = p?.name ?? pid;
                  return (
                    <label key={pid} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={checked} onChange={() => togglePermission(pid)} />
                      <span className="truncate">{label}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-500 mt-2">{t('users.noPermissions')}</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label={t('users.bankName')} value={bankName} onChange={(e) => setBankName(e.target.value)} required />
            <Input label={t('users.bankAccountName')} value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} required />
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={submitting}>
              {editingId ? t('common.update') : t('users.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

