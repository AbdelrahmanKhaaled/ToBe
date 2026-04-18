import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ConfirmProvider } from '@/utils/confirmDialog';
import { ConfirmDialog } from '@/components/ui';
import { ToastContainer } from '@/components/ToastContainer';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { hasAnyPermission, hasPermission } from '@/utils/permissions';
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
import { ConsultationRequests } from '@/pages/ConsultationRequests';
import { ConsultationRequestSingle } from '@/pages/ConsultationRequestSingle';
import { Users } from '@/pages/Users';
import { UserSingle } from '@/pages/UserSingle';
import { SubCategorySingle } from '@/pages/SubCategorySingle';
import { ConsultationCategorySingle } from '@/pages/ConsultationCategorySingle';
import { ConsultationSubCategorySingle } from '@/pages/ConsultationSubCategorySingle';
import { ConsultationSessionSingle } from '@/pages/ConsultationSessionSingle';
import { BannerSingle } from '@/pages/BannerSingle';
import { Tags } from '@/pages/Tags';
import { Posts } from '@/pages/Posts';
import { PostSingle } from '@/pages/PostSingle';
import { Polls } from '@/pages/Polls';
import { PollSingle } from '@/pages/PollSingle';

function ProtectedRoute({ children }) {
  const { authenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!authenticated) return <Navigate to="/login" replace />;
  return children;
}

function PermissionRoute({ permKey, children }) {
  const auth = useAuth();
  const { loading } = auth;
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!permKey) return children;
  const allowed = Array.isArray(permKey) ? hasAnyPermission(auth, permKey) : hasPermission(auth, permKey);
  if (!allowed) return <Navigate to="/" replace />;
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
        <Route
          path="categories"
          element={
            <PermissionRoute permKey="categories">
              <Categories />
            </PermissionRoute>
          }
        />
        <Route
          path="categories/:id"
          element={
            <PermissionRoute permKey="categories">
              <CategorySingle />
            </PermissionRoute>
          }
        />
        <Route
          path="sub-categories"
          element={
            <PermissionRoute permKey="sub_categories">
              <SubCategories />
            </PermissionRoute>
          }
        />
        <Route
          path="sub-categories/:id"
          element={
            <PermissionRoute permKey="sub_categories">
              <SubCategorySingle />
            </PermissionRoute>
          }
        />
        <Route
          path="levels"
          element={
            <PermissionRoute permKey="levels">
              <Levels />
            </PermissionRoute>
          }
        />
        <Route
          path="levels/:id"
          element={
            <PermissionRoute permKey="levels">
              <LevelSingle />
            </PermissionRoute>
          }
        />
        <Route
          path="mentors"
          element={
            <PermissionRoute permKey="mentors">
              <Mentors />
            </PermissionRoute>
          }
        />
        <Route
          path="mentors/:id"
          element={
            <PermissionRoute permKey="mentors">
              <MentorSingle />
            </PermissionRoute>
          }
        />
        <Route
          path="courses"
          element={
            <PermissionRoute permKey="courses">
              <Courses />
            </PermissionRoute>
          }
        />
        <Route
          path="courses/:id"
          element={
            <PermissionRoute permKey={['courses', 'lessons']}>
              <CourseSingle />
            </PermissionRoute>
          }
        />
        <Route
          path="lessons"
          element={
            <PermissionRoute permKey="lessons">
              <Lessons />
            </PermissionRoute>
          }
        />
        <Route
          path="lessons/:id"
          element={
            <PermissionRoute permKey="lessons">
              <LessonSingle />
            </PermissionRoute>
          }
        />
        <Route
          path="articles"
          element={
            <PermissionRoute permKey="articles">
              <Articles />
            </PermissionRoute>
          }
        />
        <Route
          path="articles/:id"
          element={
            <PermissionRoute permKey="articles">
              <ArticleSingle />
            </PermissionRoute>
          }
        />
        <Route
          path="tags"
          element={
            <PermissionRoute permKey="tags">
              <Tags />
            </PermissionRoute>
          }
        />
        <Route
          path="posts"
          element={
            <PermissionRoute permKey="posts">
              <Posts />
            </PermissionRoute>
          }
        />
        <Route
          path="posts/:id"
          element={
            <PermissionRoute permKey="posts">
              <PostSingle />
            </PermissionRoute>
          }
        />
        <Route
          path="polls"
          element={
            <PermissionRoute permKey="polls">
              <Polls />
            </PermissionRoute>
          }
        />
        <Route
          path="polls/:id"
          element={
            <PermissionRoute permKey="polls">
              <PollSingle />
            </PermissionRoute>
          }
        />
        <Route
          path="faqs"
          element={
            <PermissionRoute permKey="faqs">
              <Faqs />
            </PermissionRoute>
          }
        />
        <Route
          path="faqs/:id"
          element={
            <PermissionRoute permKey="faqs">
              <FaqSingle />
            </PermissionRoute>
          }
        />
        <Route
          path="banners"
          element={
            <PermissionRoute permKey="banners">
              <Banners />
            </PermissionRoute>
          }
        />
        <Route
          path="banners/:id"
          element={
            <PermissionRoute permKey="banners">
              <BannerSingle />
            </PermissionRoute>
          }
        />
        <Route
          path="about"
          element={
            <PermissionRoute permKey="about_us">
              <AboutPage />
            </PermissionRoute>
          }
        />
        <Route
          path="consultation-categories"
          element={
            <PermissionRoute permKey="consultation_categories">
              <ConsultationCategories />
            </PermissionRoute>
          }
        />
        <Route
          path="consultation-categories/:id"
          element={
            <PermissionRoute permKey="consultation_categories">
              <ConsultationCategorySingle />
            </PermissionRoute>
          }
        />
        <Route
          path="consultation-sub-categories"
          element={
            <PermissionRoute permKey="consultation_sub_categories">
              <ConsultationSubCategories />
            </PermissionRoute>
          }
        />
        <Route
          path="consultation-sub-categories/:id"
          element={
            <PermissionRoute permKey="consultation_sub_categories">
              <ConsultationSubCategorySingle />
            </PermissionRoute>
          }
        />
        <Route
          path="consultation-sessions"
          element={
            <PermissionRoute permKey="consultation_sessions">
              <ConsultationSessions />
            </PermissionRoute>
          }
        />
        <Route
          path="consultation-sessions/:id"
          element={
            <PermissionRoute permKey="consultation_sessions">
              <ConsultationSessionSingle />
            </PermissionRoute>
          }
        />
        <Route
          path="reservations"
          element={
            <PermissionRoute permKey="reservations">
              <Reservations />
            </PermissionRoute>
          }
        />
        <Route
          path="consultation-reservations"
          element={
            <PermissionRoute permKey="consultation_reservations">
              <ConsultationReservations />
            </PermissionRoute>
          }
        />
        <Route
          path="consultation-requests"
          element={
            <PermissionRoute permKey="consultation_requests">
              <ConsultationRequests />
            </PermissionRoute>
          }
        />
        <Route
          path="consultation-requests/:id"
          element={
            <PermissionRoute permKey="consultation_requests">
              <ConsultationRequestSingle />
            </PermissionRoute>
          }
        />
        <Route
          path="users"
          element={
            <PermissionRoute permKey="users">
              <Users />
            </PermissionRoute>
          }
        />
        <Route
          path="users/:id"
          element={
            <PermissionRoute permKey="users">
              <UserSingle />
            </PermissionRoute>
          }
        />
        <Route
          path="roles-permissions"
          element={
            <PermissionRoute permKey="permissions">
              <RolesPermissions />
            </PermissionRoute>
          }
        />
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
