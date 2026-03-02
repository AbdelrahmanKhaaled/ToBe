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
        <div className="p-4 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)]">
          <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-3">{t('rolesPage.roles')}</h2>
          <ul className="space-y-1 max-h-72 overflow-auto text-sm">
            {roles.map((role) => (
              <li key={role.id ?? role.name} className="flex items-center justify-between gap-2">
                <span className="font-medium">{role.name}</span>
                {role.guard_name && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                    {role.guard_name}
                  </span>
                )}
              </li>
            ))}
            {!roles.length && <li className="text-gray-500">{t('rolesPage.noRoles')}</li>}
          </ul>
        </div>

        <div className="p-4 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)]">
          <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-3">{t('rolesPage.permissions')}</h2>
          <ul className="space-y-1 max-h-72 overflow-auto text-sm">
            {permissions.map((perm) => (
              <li key={perm.id ?? perm.name} className="flex items-center justify-between gap-2">
                <span>{perm.name}</span>
                {perm.guard_name && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                    {perm.guard_name}
                  </span>
                )}
              </li>
            ))}
            {!permissions.length && <li className="text-gray-500">{t('rolesPage.noPermissions')}</li>}
          </ul>
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

