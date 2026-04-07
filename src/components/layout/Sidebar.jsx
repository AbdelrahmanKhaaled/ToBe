import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Sidebar() {
  const { t } = useTranslation();

  const NAV_ITEMS = [
    { to: '/', label: t('nav.dashboard', 'Dashboard') },
    { to: '/categories', label: t('nav.categories', 'Categories') },
    { to: '/sub-categories', label: t('nav.subCategories', 'Sub-categories') },
    { to: '/levels', label: t('nav.levels', 'Levels') },
    { to: '/mentors', label: t('nav.mentors', 'Mentors') },
    { to: '/courses', label: t('nav.courses', 'Courses') },
    { to: '/articles', label: t('nav.articles', 'Articles') },
    { to: '/tags', label: t('nav.tags', 'Tags') },
    { to: '/posts', label: t('nav.posts', 'Posts') },
    { to: '/polls', label: t('nav.polls', 'Polls') },
    { to: '/faqs', label: t('nav.faqs', 'FAQs') },
    { to: '/banners', label: t('nav.banners', 'Banners') },
    { to: '/about', label: t('nav.about', 'About page') },
    { to: '/consultation-categories', label: t('nav.consultationCategories', 'Consultation categories') },
    { to: '/consultation-sub-categories', label: t('nav.consultationSubCategories', 'Consultation sub-categories') },
    { to: '/consultation-sessions', label: t('nav.consultationSessions', 'Consultation sessions') },
    { to: '/reservations', label: t('nav.reservations', 'Reservations') },
    { to: '/consultation-reservations', label: t('nav.consultationReservations', 'Consultation reservations') },
    { to: '/consultation-requests', label: t('nav.consultationRequests', 'Consultation requests') },
    { to: '/wallets', label: t('nav.wallets', 'Wallets') },
    { to: '/users', label: t('nav.users', 'Users') },
    { to: '/roles-permissions', label: t('nav.rolesPermissions', 'Roles & Permissions') },
    { to: '/profile', label: t('nav.profile', 'Profile') },
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

