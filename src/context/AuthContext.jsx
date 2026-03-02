import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/api';
import { authStorage } from '@/utils/authStorage';

const AuthContext = createContext(null);

/** Normalize profile response so we always have { id, name, email } from any common API shape */
function normalizeProfileUser(res) {
  if (!res) return null;
  const raw = res.data ?? res;
  const user = raw?.user ?? raw;
  if (!user || typeof user !== 'object') return null;
  return {
    id: user.id,
    name: user.name ?? user.name_ar ?? user.name_en ?? '',
    email: user.email ?? '',
    ...user,
  };
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    loading: true,
    authenticated: false,
  });
  const navigate = useNavigate();

  const refreshUser = useCallback(async () => {
    if (!authStorage.isAuthenticated()) {
      setState({ user: null, loading: false, authenticated: false });
      return;
    }
    try {
      const res = await AuthService.getProfile();
      const u = normalizeProfileUser(res);
      setState({ user: u, loading: false, authenticated: true });
    } catch {
      authStorage.clear();
      setState({ user: null, loading: false, authenticated: false });
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (email, password) => {
      const res = await AuthService.login(email, password);
      authStorage.setToken(res.token);
      const user = normalizeProfileUser({ data: res.user }) ?? normalizeProfileUser(res) ?? res.user ?? res;
      setState({ user: user && typeof user === 'object' ? user : null, loading: false, authenticated: true });
      navigate('/');
    },
    [navigate]
  );

  const logout = useCallback(async () => {
    await AuthService.logout();
    authStorage.clear();
    setState({ user: null, loading: false, authenticated: false });
    navigate('/login');
  }, [navigate]);

  const logoutAllDevices = useCallback(async () => {
    try {
      await AuthService.logoutAllDevices();
    } finally {
      authStorage.clear();
      setState({ user: null, loading: false, authenticated: false });
      navigate('/login');
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, logoutAllDevices, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
