import { useEffect, useState } from 'react';
import { AccessControlService } from '@/api';
import { Button, Loading } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

export function RolesPermissions() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleGuard, setNewRoleGuard] = useState('web');
  const [newPermName, setNewPermName] = useState('');
  const [newPermGuard, setNewPermGuard] = useState('web');
  const [userId, setUserId] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true);
      try {
        const [rolesRes, permsRes] = await Promise.all([
          AccessControlService.roles.listRoles(),
          AccessControlService.permissions.listPermissions(),
        ]);
        setRoles(Array.isArray(rolesRes?.data) ? rolesRes.data : rolesRes);
        setPermissions(Array.isArray(permsRes?.data) ? permsRes.data : permsRes);
      } catch (err) {
        toast.error(err.message || 'Failed to load roles & permissions');
      } finally {
        setLoading(false);
      }
    };
    fetchLists();
  }, []);

  const refetchLists = async () => {
    const [rolesRes, permsRes] = await Promise.all([
      AccessControlService.roles.listRoles(),
      AccessControlService.permissions.listPermissions(),
    ]);
    setRoles(Array.isArray(rolesRes?.data) ? rolesRes.data : rolesRes);
    setPermissions(Array.isArray(permsRes?.data) ? permsRes.data : permsRes);
  };

  const handleCreateRole = async () => {
    if (!newRoleName) return;
    setUpdating(true);
    try {
      await AccessControlService.roles.createRole({ name: newRoleName, guard_name: newRoleGuard || 'web' });
      toast.success(t('rolesPage.toasts.roleCreated'));
      setNewRoleName('');
      await refetchLists();
    } catch (err) {
      toast.error(err.message || t('rolesPage.toasts.roleCreateFailed'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    setUpdating(true);
    try {
      await AccessControlService.roles.deleteRole(roleId);
      toast.success(t('rolesPage.toasts.roleDeleted'));
      await refetchLists();
    } catch (err) {
      toast.error(err.message || t('rolesPage.toasts.roleDeleteFailed'));
    } finally {
      setUpdating(false);
    }
  };

  const handleCreatePermission = async () => {
    if (!newPermName) return;
    setUpdating(true);
    try {
      await AccessControlService.permissions.createPermission({ name: newPermName, guard_name: newPermGuard || 'web' });
      toast.success(t('rolesPage.toasts.permissionCreated'));
      setNewPermName('');
      await refetchLists();
    } catch (err) {
      toast.error(err.message || t('rolesPage.toasts.permissionCreateFailed'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePermission = async (permId) => {
    setUpdating(true);
    try {
      await AccessControlService.permissions.deletePermission(permId);
      toast.success(t('rolesPage.toasts.permissionDeleted'));
      await refetchLists();
    } catch (err) {
      toast.error(err.message || t('rolesPage.toasts.permissionDeleteFailed'));
    } finally {
      setUpdating(false);
    }
  };

  const handleFetchUser = async () => {
    if (!userId) return;
    setUpdating(true);
    try {
      const res = await AccessControlService.users.getUserRolesAndPermissions(userId);
      setUserInfo(res);
      const rolesArr =
        res?.roles ??
        res?.data?.roles ??
        res?.user_roles ??
        [];
      const roleNames = rolesArr.map((r) => r.name || r);
      setSelectedRoles(roleNames);
    } catch (err) {
      toast.error(err.message || 'Failed to load user roles');
      setUserInfo(null);
      setSelectedRoles([]);
    } finally {
      setUpdating(false);
    }
  };

  const handleSyncRoles = async () => {
    if (!userId) return;
    setUpdating(true);
    try {
      await AccessControlService.users.syncRoles(userId, selectedRoles);
      toast.success('User roles updated');
      await handleFetchUser();
    } catch (err) {
      toast.error(err.message || 'Failed to update user roles');
    } finally {
      setUpdating(false);
    }
  };

  const toggleRole = (roleName) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]
    );
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[var(--color-primary)]">{t('rolesPage.title')}</h1>
      {/* Lists */}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-[var(--shadow)] border border-[var(--color-border)]">
          <div className="px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('rolesPage.roles')}</h2>
          </div>

          <div className="px-6 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_180px_minmax(160px,220px)] gap-4 items-end">
              <Input
                label={t('rolesPage.create.name')}
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
              <Input
                label={t('rolesPage.create.guard')}
                value={newRoleGuard}
                onChange={(e) => setNewRoleGuard(e.target.value)}
              />
              <Button
                type="button"
                onClick={handleCreateRole}
                loading={updating}
                className="w-full md:w-auto whitespace-nowrap bg-[var(--color-accent)] text-white hover:opacity-95 rounded-xl justify-center px-3"
              >
                {t('rolesPage.create.createRole')}
              </Button>
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] overflow-hidden rounded-b-2xl">
            <div className="max-h-[420px] overflow-auto">
              <div className="px-6 py-2 text-xs text-gray-500 bg-gray-50 border-b border-[var(--color-border)] grid grid-cols-[1fr_100px_88px] gap-3">
                <div className="font-medium">{t('rolesPage.create.name')}</div>
                <div className="font-medium text-right">{t('rolesPage.create.guard')}</div>
                <div className="font-medium text-right">{t('rolesPage.create.delete')}</div>
              </div>

              <ul className="text-sm">
                {roles.map((role) => (
                  <li
                    key={role.id ?? role.name}
                    className="px-6 py-3 grid grid-cols-[1fr_100px_88px] gap-3 items-center border-b border-[var(--color-border)] last:border-b-0"
                  >
                    <div className="font-medium text-gray-800 truncate" title={role.name}>
                      {role.name}
                    </div>
                    <div className="text-right">
                      {role.guard_name ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-[11px] rounded-full bg-gray-100 text-gray-600">
                          {role.guard_name}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                    <div className="text-right">
                      {role.id != null ? (
                        <Button
                          type="button"
                          variant="danger"
                          className="!py-1 !px-3 !text-xs !rounded-full"
                          loading={updating}
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          {t('rolesPage.create.delete')}
                        </Button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </li>
                ))}
                {!roles.length && <li className="px-6 py-8 text-gray-500">{t('rolesPage.noRoles')}</li>}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[var(--shadow)] border border-[var(--color-border)]">
          <div className="px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('rolesPage.permissions')}</h2>
          </div>

          <div className="px-6 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_180px_minmax(180px,240px)] gap-4 items-end">
              <Input
                label={t('rolesPage.create.name')}
                value={newPermName}
                onChange={(e) => setNewPermName(e.target.value)}
              />
              <Input
                label={t('rolesPage.create.guard')}
                value={newPermGuard}
                onChange={(e) => setNewPermGuard(e.target.value)}
              />
              <Button
                type="button"
                onClick={handleCreatePermission}
                loading={updating}
                className="w-full md:w-auto whitespace-nowrap bg-[var(--color-accent)] text-white hover:opacity-95 rounded-xl justify-center px-3"
              >
                {t('rolesPage.create.createPermission')}
              </Button>
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] overflow-hidden rounded-b-2xl">
            <div className="max-h-[420px] overflow-auto">
              <div className="px-6 py-2 text-xs text-gray-500 bg-gray-50 border-b border-[var(--color-border)] grid grid-cols-[1fr_100px_88px] gap-3">
                <div className="font-medium">{t('rolesPage.create.name')}</div>
                <div className="font-medium text-right">{t('rolesPage.create.guard')}</div>
                <div className="font-medium text-right">{t('rolesPage.create.delete')}</div>
              </div>

              <ul className="text-sm">
                {permissions.map((perm) => (
                  <li
                    key={perm.id ?? perm.name}
                    className="px-6 py-3 grid grid-cols-[1fr_100px_88px] gap-3 items-center border-b border-[var(--color-border)] last:border-b-0"
                  >
                    <div className="text-gray-800 truncate" title={perm.name}>
                      {perm.name}
                    </div>
                    <div className="text-right">
                      {perm.guard_name ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-[11px] rounded-full bg-gray-100 text-gray-600">
                          {perm.guard_name}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                    <div className="text-right">
                      {perm.id != null ? (
                        <Button
                          type="button"
                          variant="danger"
                          className="!py-1 !px-3 !text-xs !rounded-full"
                          loading={updating}
                          onClick={() => handleDeletePermission(perm.id)}
                        >
                          {t('rolesPage.create.delete')}
                        </Button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </li>
                ))}
                {!permissions.length && <li className="px-6 py-8 text-gray-500">{t('rolesPage.noPermissions')}</li>}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="p-4 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)]">
        <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-4">
          {t('rolesPage.manageUserRoles')}
        </h2>
        <div className="flex flex-col md:flex-row gap-3 items-end mb-4">
          <div className="flex-1">
            <Input
              label={t('rolesPage.userId')}
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <Button type="button" onClick={handleFetchUser} loading={updating}>
            {t('rolesPage.loadUserRoles')}
          </Button>
        </div>

        {userInfo && (
          <div className="space-y-4">
            {userInfo.user && (
              <div className="text-sm text-gray-700">
                <span className="font-medium">{t('rolesPage.userLabel')}</span>{' '}
                {userInfo.user.name ?? userInfo.user.email ?? userInfo.user.id}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-[var(--color-primary)] mb-2">
                {t('rolesPage.selectRolesForUser')}
              </p>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => {
                  const name = role.name;
                  const active = selectedRoles.includes(name);
                  return (
                    <button
                      key={role.id ?? name}
                      type="button"
                      onClick={() => toggleRole(name)}
                      className={`px-3 py-1 rounded-full border text-xs ${
                        active
                          ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                          : 'bg-white text-gray-700 border-[var(--color-border)]'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
                {!roles.length && (
                  <span className="text-sm text-gray-500">
                    {t('rolesPage.noRolesToAssign')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={handleSyncRoles} loading={updating}>
                {t('rolesPage.saveRoles')}
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

