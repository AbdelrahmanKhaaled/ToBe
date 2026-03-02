import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Input } from '@/components/ui';
import { useTranslation } from 'react-i18next';

export function Login() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || t('login.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-light)]">
      <div className="w-full max-w-md p-8 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]">
        <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6 text-center">
          {t('login.title')}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('login.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label={t('login.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            {t('login.signIn')}
          </Button>
        </form>
      </div>
    </div>
  );
}
