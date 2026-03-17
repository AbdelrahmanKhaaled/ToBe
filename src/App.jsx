import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ConfirmProvider } from '@/utils/confirmDialog';
import { ConfirmDialog } from '@/components/ui';
import { ToastContainer } from '@/components/ToastContainer';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Login } from '@/pages/Login';
import { DashboardHome } from '@/pages/DashboardHome';
import { Categories } from '@/pages/Categories';
import { CategorySingle } from '@/pages/CategorySingle';
import { SubCategories } from '@/pages/SubCategories';
import { Levels } from '@/pages/Levels';
import { LevelSingle } from '@/pages/LevelSingle';
import { Mentors } from '@/pages/Mentors';
import { MentorSingle } from '@/pages/MentorSingle';
import { Courses } from '@/pages/Courses';
import { CourseSingle } from '@/pages/CourseSingle';
import { Lessons } from '@/pages/Lessons';
import { LessonSingle } from '@/pages/LessonSingle';
import { Articles } from '@/pages/Articles';
import { ArticleSingle } from '@/pages/ArticleSingle';
import { Faqs } from '@/pages/Faqs';
import { FaqSingle } from '@/pages/FaqSingle';
import { Profile } from '@/pages/Profile';
import { Banners } from '@/pages/Banners';
import { RolesPermissions } from '@/pages/RolesPermissions';
import { AboutPage } from '@/pages/AboutPage';
import { ConsultationCategories } from '@/pages/ConsultationCategories';
import { ConsultationSubCategories } from '@/pages/ConsultationSubCategories';
import { ConsultationSessions } from '@/pages/ConsultationSessions';
import { Reservations } from '@/pages/Reservations';
import { ConsultationReservations } from '@/pages/ConsultationReservations';
import { Users } from '@/pages/Users';

function ProtectedRoute({ children }) {
  const { authenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!authenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { authenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (authenticated) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="categories" element={<Categories />} />
        <Route path="categories/:id" element={<CategorySingle />} />
        <Route path="sub-categories" element={<SubCategories />} />
        <Route path="levels" element={<Levels />} />
        <Route path="levels/:id" element={<LevelSingle />} />
        <Route path="mentors" element={<Mentors />} />
        <Route path="mentors/:id" element={<MentorSingle />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:id" element={<CourseSingle />} />
        <Route path="lessons" element={<Lessons />} />
        <Route path="lessons/:id" element={<LessonSingle />} />
        <Route path="articles" element={<Articles />} />
        <Route path="articles/:id" element={<ArticleSingle />} />
        <Route path="faqs" element={<Faqs />} />
        <Route path="faqs/:id" element={<FaqSingle />} />
        <Route path="banners" element={<Banners />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="consultation-categories" element={<ConsultationCategories />} />
        <Route path="consultation-sub-categories" element={<ConsultationSubCategories />} />
        <Route path="consultation-sessions" element={<ConsultationSessions />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="consultation-reservations" element={<ConsultationReservations />} />
        <Route path="users" element={<Users />} />
        <Route path="roles-permissions" element={<RolesPermissions />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfirmProvider>
          <AppRoutes />
          <ConfirmDialog />
          <ToastContainer />
        </ConfirmProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
