import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Sidebar() {
  const { t } = useTranslation();

  const NAV_ITEMS = [
    { to: '/', label: t('nav.dashboard') },
    { to: '/categories', label: t('nav.categories') },
    { to: '/sub-categories', label: t('nav.subCategories') },
    { to: '/levels', label: t('nav.levels') },
    { to: '/mentors', label: t('nav.mentors') },
    { to: '/courses', label: t('nav.courses') },
    { to: '/lessons', label: t('nav.lessons') },
    { to: '/articles', label: t('nav.articles') },
    { to: '/faqs', label: t('nav.faqs') },
    { to: '/banners', label: t('nav.banners') },
    { to: '/about', label: t('nav.about') },
    { to: '/consultation-categories', label: t('nav.consultationCategories') },
    { to: '/consultation-sub-categories', label: t('nav.consultationSubCategories') },
    { to: '/consultation-sessions', label: t('nav.consultationSessions') },
    { to: '/reservations', label: t('nav.reservations') },
    { to: '/consultation-reservations', label: t('nav.consultationReservations') },
    { to: '/users', label: t('nav.users') },
    { to: '/roles-permissions', label: t('nav.rolesPermissions') },
    { to: '/profile', label: t('nav.profile') },
  ];

  return (
    <aside className="w-64 min-h-screen bg-[var(--color-primary)] text-white flex flex-col">
      <div className="p-4 flex items-center justify-center">
        <div className="bg-white rounded-xl p-3 shadow-md flex items-center justify-center w-full max-w-[180px]">
          <img src="/logo.png" alt="TO BE" className="h-20 w-auto object-contain" />
        </div>
      </div>
      <nav className="flex-1 px-3">
        {NAV_ITEMS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `block px-4 py-3 rounded-[var(--radius)] mb-1 transition-colors ${
                isActive ? 'bg-[#FF8000] text-white' : 'text-white/80 hover:bg-white/10'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
