import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthService } from '@/api';
import { Button, Input, Modal } from '@/components/ui';
import { useConfirm } from '@/utils/confirmDialog';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

export function Profile() {
  const { t } = useTranslation();
  const { user, refreshUser, logoutAllDevices } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    if (user) {
      setFormName(user.name ?? '');
      setFormEmail(user.email ?? '');
    }
  }, [user]);

  const startEdit = () => {
    setFormName(user?.name ?? '');
    setFormEmail(user?.email ?? '');
    setEditing(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await AuthService.updateProfile(formName, formEmail, user?.id);
      toast.success(t('profile.toasts.profileUpdated', 'Profile updated'));
      await refreshUser();
      setEditing(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t('profile.toasts.passwordMismatch', 'New password and confirmation do not match.'));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t('profile.toasts.passwordTooShort', 'New password must be at least 8 characters.'));
      return;
    }
    setPasswordSubmitting(true);
    try {
      await AuthService.updatePassword(currentPassword, newPassword, confirmPassword);
      toast.success(t('profile.toasts.passwordUpdated', 'Password updated'));
      setPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err?.message ?? t('profile.toasts.passwordUpdateFailed', 'Failed to update password'));
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    const ok = await confirm({
      title: t('profile.toasts.logoutAllTitle'),
      message: t('profile.toasts.logoutAllMessage'),
      confirmLabel: t('profile.toasts.logoutAllConfirmLabel'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await logoutAllDevices();
      toast.success(t('profile.toasts.logoutAllSuccess', 'Logged out from all devices'));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">{t('profile.title')}</h1>

      <div className="max-w-md space-y-6">
        <div className="p-6 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)]">
          {editing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label={t('profile.name')}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
              <Input
                label={t('profile.email')}
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="submit" loading={submitting}>
                  {t('profile.save')}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-gray-600">{t('profile.name')}</dt>
                  <dd className="font-medium text-[var(--color-primary)]">{user?.name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">{t('profile.email')}</dt>
                  <dd className="font-medium text-[var(--color-primary)]">{user?.email ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">{t('profile.phoneNumber')}</dt>
                  <dd className="font-medium text-[var(--color-primary)]">{user?.phone_number ?? user?.phoneNumber ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">{t('profile.roles')}</dt>
                  <dd className="font-medium text-[var(--color-primary)]">
                    {Array.isArray(user?.roles) && user.roles.length ? user.roles.join(', ') : '—'}
                  </dd>
                </div>
              </dl>
              <Button variant="primary" onClick={startEdit} className="mt-4 w-full">
                {t('profile.editProfile')}
              </Button>
            </>
          )}
        </div>

        <div className="p-6 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)]">
          <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-2">
            {t('profile.passwordSectionTitle')}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {t('profile.passwordSectionDescription')}
          </p>
          <Button variant="secondary" onClick={() => setPasswordModalOpen(true)}>
            {t('profile.updatePassword')}
          </Button>
        </div>

        <div className="p-6 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)]">
          <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-2">
            {t('profile.sessionsSectionTitle')}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {t('profile.sessionsSectionDescription')}
          </p>
          <Button variant="danger" onClick={handleLogoutAllDevices}>
            {t('profile.logoutAllDevicesButton')}
          </Button>
        </div>
      </div>

      <Modal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title={t('profile.updatePassword')}
      >
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <Input
            label={t('profile.currentPassword')}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Input
            label={t('profile.newPassword')}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <Input
            label={t('profile.confirmNewPassword')}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setPasswordModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={passwordSubmitting}>
              {t('profile.updatePassword')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
