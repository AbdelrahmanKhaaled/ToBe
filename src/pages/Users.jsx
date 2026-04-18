import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AccessControlService, UserService } from '@/api';
import { Button, DataTable, IconEdit, IconTrash, IconView, Input, Loading, Modal } from '@/components/ui';
import { useConfirm } from '@/utils/confirmDialog';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

function normalizeListItem(row, idx, fallbackPage) {
  const id = row?.id ?? row?.user_id ?? row?.userId ?? row?._id ?? `${fallbackPage}-${idx}`;
  return { ...row, id: id != null ? String(id) : `${fallbackPage}-${idx}` };
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

function extractRoleNames(rolesRaw) {
  if (!rolesRaw) return [];
  const arr = Array.isArray(rolesRaw) ? rolesRaw : [rolesRaw];
  return arr
    .map((r) => {
      if (r == null) return null;
      if (typeof r === 'string') return r;
      if (typeof r === 'number') return String(r);
      return r?.name != null ? String(r.name) : r?.role_name != null ? String(r.role_name) : null;
    })
    .filter(Boolean)
    .map((x) => String(x).trim().toLowerCase())
    .filter(Boolean);
}

function isAdminLikeUser(row) {
  const names = extractRoleNames(row?.roles ?? row?.role ?? row?.user_roles ?? row?.userRoles ?? row?.role_names);
  return names.includes('admin') || names.includes('super-admin') || names.includes('superadmin');
}

function isBlockedStatus(status) {
  return String(status ?? '').trim().toLowerCase() === 'blocked';
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
  const [searchParams, setSearchParams] = useSearchParams();

  // List
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

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
  const [activeTab, setActiveTab] = useState('admins'); // 'admins' | 'students'

  useEffect(() => {
    const tab = String(searchParams.get('tab') ?? '').toLowerCase();
    if (tab === 'students') setActiveTab('students');
    else if (tab === 'admins') setActiveTab('admins');
  }, [searchParams]);

  const setTab = useCallback(
    (tab) => {
      setActiveTab(tab);
      setSearchParams((p) => {
        const next = new URLSearchParams(p);
        if (tab === 'students') next.set('tab', 'students');
        else next.delete('tab');
        return next;
      });
    },
    [setSearchParams]
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
  const [password, setPassword] = useState('');

  const resetForm = useCallback(() => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPhoneNumber('');
    setSelectedRoleId('');
    setSelectedPermissionIds([]);
    setPassword('');
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

  const filteredData = useMemo(() => {
    if (activeTab === 'students') return data.filter((r) => !isAdminLikeUser(r));
    return data.filter((r) => isAdminLikeUser(r));
  }, [activeTab, data]);

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
    setPassword('');

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
    if (password !== '') {
      if (password.length < 8) {
        toast.error(t('profile.toasts.passwordTooShort', 'New password must be at least 8 characters.'));
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        email,
        phone_number: phoneNumber === '' ? null : phoneNumber,
        roles: [selectedRoleId],
        permissions: selectedPermissionIds,
      };
      if (password) {
        payload.password = password;
        // Backend often requires `confirmed` rule; we auto-fill it without a UI field.
        payload.password_confirmation = password;
      }

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

  const handleRowStatusToggle = async (row) => {
    const id = row?.id;
    if (id == null || id === '') return;
    const blocked = isBlockedStatus(row.status);
    const next = blocked ? 'active' : 'blocked';
    setStatusUpdatingId(String(id));
    try {
      await UserService.updateStatus(id, next);
      setData((prev) =>
        prev.map((r) => (String(r.id) === String(id) ? { ...r, status: next } : r))
      );
      toast.success(t('users.statusUpdated'));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStatusUpdatingId(null);
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
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">
            {activeTab === 'students' ? t('users.studentsTitle', 'Students') : t('users.title', 'Admins')}
          </h1>
          <div className="flex items-center rounded-[var(--radius)] border border-[var(--color-border)] bg-white p-1">
            <button
              type="button"
              onClick={() => setTab('admins')}
              className={`px-3 py-1.5 text-sm rounded-[var(--radius)] transition-colors ${
                activeTab === 'admins' ? 'bg-[var(--color-accent)] text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('users.tabs.admins', 'Admins')}
            </button>
            <button
              type="button"
              onClick={() => setTab('students')}
              className={`px-3 py-1.5 text-sm rounded-[var(--radius)] transition-colors ${
                activeTab === 'students' ? 'bg-[var(--color-accent)] text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('users.tabs.students', 'Students')}
            </button>
          </div>
        </div>
        {activeTab === 'admins' ? <Button onClick={openCreate}>{t('users.create', 'Create admin')}</Button> : null}
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
        ]}
        data={filteredData}
        meta={meta ?? undefined}
        onPageChange={(pageNum, linkUrl) => (linkUrl ? fetchByUrl(linkUrl) : setPage(pageNum))}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        emptyMessage={t('users.empty')}
        actions={(row) => (
          <div className="flex flex-wrap items-center justify-end gap-1">
            <Link to={`/users/${row.id}`}>
              <Button
                variant="ghost"
                className="!p-2 min-w-0"
                title={t('common.view')}
                aria-label={t('common.view')}
              >
                <IconView />
              </Button>
            </Link>
            <button
              type="button"
              role="switch"
              aria-checked={!isBlockedStatus(row.status)}
              title={`${t('users.detailStatus')}: ${isBlockedStatus(row.status) ? t('users.statusBlocked') : t('users.statusActive')}`}
              aria-label={t('users.toggleStatusAria')}
              disabled={statusUpdatingId === String(row.id)}
              onClick={() => handleRowStatusToggle(row)}
              className={`flex h-7 w-12 shrink-0 items-center rounded-full px-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1 disabled:opacity-50 ${
                isBlockedStatus(row.status) ? 'bg-gray-300' : 'bg-[var(--color-accent)]'
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white shadow transition-[margin] duration-200 ease-out ${
                  isBlockedStatus(row.status) ? '' : 'ms-auto'
                }`}
              />
            </button>
            {activeTab === 'admins' ? (
              <Button variant="ghost" className="!p-2 min-w-0" title={t('common.edit')} aria-label="Edit" onClick={() => openEdit(row)}>
                <IconEdit />
              </Button>
            ) : null}
            <Button variant="danger" className="!p-2 min-w-0" title={t('common.delete')} aria-label="Delete" onClick={() => handleDelete(row)}>
              <IconTrash />
            </Button>
          </div>
        )}
      />

      {activeTab === 'admins' ? (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? t('common.edit') : t('common.create')}>
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label={t('users.name')} value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label={t('users.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <Input label={t('users.phoneNumber')} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />

          <Input
            label={editingId ? t('users.newPassword', 'New password (leave blank to keep)') : t('users.password', 'Password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={false}
          />

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
      ) : null}
    </div>
  );
}

