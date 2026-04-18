import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/utils/permissions';

export function Sidebar() {
  const { t } = useTranslation();
  const auth = useAuth();

  const NAV_ITEMS = [
    { to: '/', label: t('nav.dashboard', 'Dashboard'), permKey: null },
    { to: '/categories', label: t('nav.categories', 'Categories'), permKey: 'categories' },
    { to: '/sub-categories', label: t('nav.subCategories', 'Sub-categories'), permKey: 'sub_categories' },
    { to: '/levels', label: t('nav.levels', 'Levels'), permKey: 'levels' },
    { to: '/mentors', label: t('nav.mentors', 'Mentors'), permKey: 'mentors' },
    { to: '/courses', label: t('nav.courses', 'Courses'), permKey: 'courses' },
    { to: '/lessons', label: t('nav.lessons', 'Lessons'), permKey: 'lessons' },
    { to: '/articles', label: t('nav.articles', 'Articles'), permKey: 'articles' },
    { to: '/tags', label: t('nav.tags', 'Tags'), permKey: 'tags' },
    { to: '/posts', label: t('nav.posts', 'Posts'), permKey: 'posts' },
    { to: '/polls', label: t('nav.polls', 'Polls'), permKey: 'polls' },
    { to: '/faqs', label: t('nav.faqs', 'FAQs'), permKey: 'faqs' },
    { to: '/banners', label: t('nav.banners', 'Banners'), permKey: 'banners' },
    { to: '/about', label: t('nav.about', 'About page'), permKey: 'about_us' },
    { to: '/consultation-categories', label: t('nav.consultationCategories', 'Consultation categories'), permKey: 'consultation_categories' },
    {
      to: '/consultation-sub-categories',
      label: t('nav.consultationSubCategories', 'Consultation sub-categories'),
      permKey: 'consultation_sub_categories',
    },
    { to: '/consultation-sessions', label: t('nav.consultationSessions', 'Consultation sessions'), permKey: 'consultation_sessions' },
    { to: '/reservations', label: t('nav.reservations', 'Reservations'), permKey: 'reservations' },
    { to: '/consultation-reservations', label: t('nav.consultationReservations', 'Consultation reservations'), permKey: 'consultation_reservations' },
    { to: '/consultation-requests', label: t('nav.consultationRequests', 'Consultation requests'), permKey: 'consultation_requests' },
    { to: '/users', label: t('nav.users', 'Users'), permKey: 'users' },
    { to: '/roles-permissions', label: t('nav.rolesPermissions', 'Roles & Permissions'), permKey: 'permissions' },
    { to: '/profile', label: t('nav.profile', 'Profile'), permKey: null },
  ];

  function canSeeItem(item) {
    if (!item?.permKey) return true;
    return hasPermission(auth, item.permKey);
  }

  const visibleItems = NAV_ITEMS.filter(canSeeItem);

  return (
    <aside className="w-64 min-h-screen bg-[var(--color-primary)] text-white flex flex-col">
      <div className="p-4 flex items-center justify-center">
        <div className="bg-white rounded-xl p-3 shadow-md flex items-center justify-center w-full max-w-[180px]">
          <img src="/logo.png" alt="TO BE" className="h-20 w-auto object-contain" />
        </div>
      </div>
      <nav className="flex-1 px-3">
        {visibleItems.map(({ to, label }) => (
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

