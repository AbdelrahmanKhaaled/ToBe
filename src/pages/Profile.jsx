import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthService } from '@/api';
import { Button, Input, Modal } from '@/components/ui';
import { useConfirm } from '@/utils/confirmDialog';
import { toast } from '@/utils/toast';

export function Profile() {
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
      toast.success('Profile updated');
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
      toast.error('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    setPasswordSubmitting(true);
    try {
      await AuthService.updatePassword(currentPassword, newPassword, confirmPassword);
      toast.success('Password updated');
      setPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err?.message ?? 'Failed to update password');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    const ok = await confirm({
      title: 'Logout from all devices',
      message: 'You will be logged out everywhere. Continue?',
      confirmLabel: 'Logout everywhere',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await logoutAllDevices();
      toast.success('Logged out from all devices');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">Profile</h1>

      <div className="max-w-md space-y-6">
        <div className="p-6 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)]">
          {editing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label="Name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="submit" loading={submitting}>
                  Save
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-gray-600">Name</dt>
                  <dd className="font-medium text-[var(--color-primary)]">{user?.name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Email</dt>
                  <dd className="font-medium text-[var(--color-primary)]">{user?.email ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">ID</dt>
                  <dd className="font-mono text-sm text-[var(--color-primary)]">{user?.id ?? '—'}</dd>
                </div>
              </dl>
              <Button variant="ghost" onClick={startEdit} className="mt-4">
                Edit profile
              </Button>
            </>
          )}
        </div>

        <div className="p-6 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)]">
          <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-2">Password</h2>
          <p className="text-sm text-gray-600 mb-4">
            Change your account password. You will need to use the new password to sign in next time.
          </p>
          <Button variant="secondary" onClick={() => setPasswordModalOpen(true)}>
            Update password
          </Button>
        </div>

        <div className="p-6 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)]">
          <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-2">Sessions</h2>
          <p className="text-sm text-gray-600 mb-4">
            Log out from all devices (including this one). You will need to sign in again.
          </p>
          <Button variant="danger" onClick={handleLogoutAllDevices}>
            Logout from all devices
          </Button>
        </div>
      </div>

      <Modal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} title="Update password">
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={passwordSubmitting}>
              Update password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
