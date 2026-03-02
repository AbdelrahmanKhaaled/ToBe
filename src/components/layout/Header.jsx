import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';

export function Header() {
  const { user, logout } = useAuth();
  const { lang, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const isAr = lang === 'ar';

  return (
    <header className="h-14 px-6 flex items-center justify-between bg-[var(--color-primary)] text-white">
      <h1 className="text-lg font-semibold">{t('header.dashboard')}</h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs bg-white/10 rounded-full px-2 py-1">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2 py-0.5 rounded-full ${!isAr ? 'bg-white text-[var(--color-primary)]' : 'text-white/80'}`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage('ar')}
            className={`px-2 py-0.5 rounded-full ${isAr ? 'bg-white text-[var(--color-primary)]' : 'text-white/80'}`}
          >
            AR
          </button>
        </div>
        <span className="text-sm text-white/80">{user?.name ?? user?.email}</span>
        <Button variant="ghost" onClick={logout} className="text-white hover:bg-white/10">
          {t('header.logout')}
        </Button>
      </div>
    </header>
  );
}
