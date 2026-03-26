import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/api';
import { authStorage } from '@/utils/authStorage';

const AuthContext = createContext(null);

/** Normalize profile response so we always have { id, name, email } from any common API shape */
function normalizeProfileUser(res) {
  if (!res) return null;
  const raw = res.data ?? res;
  const userObj = raw?.user ?? raw;
  if (!userObj || typeof userObj !== 'object') return null;

  // Some backends return roles at top-level: { user: {...}, roles: "super-admin" }
  // Some return roles inside user: { user: {..., role: [{ name, ... }] } }
  const rolesRaw = raw?.roles ?? userObj?.roles ?? userObj?.role ?? null;

  const userId = userObj?.id != null ? String(userObj.id) : null;

  let roles = [];
  if (Array.isArray(rolesRaw)) {
    // If backend returns role objects with pivot.model_id, filter by current user.
    const pivotFiltered = rolesRaw.filter((r) => {
      if (!r || typeof r === 'string') return false;
      const modelId = r?.pivot?.model_id;
      return userId && modelId != null && String(modelId) === userId;
    });

    const effective = pivotFiltered.length > 0 ? pivotFiltered : rolesRaw;

    roles = effective
      .map((r) => {
        if (typeof r === 'string') return r;
        // Most common: { name: "super-admin" }
        if (r?.name) return r.name;
        // Fallback: if id exists, keep it as string
        if (r?.id != null) return String(r.id);
        return null;
      })
      .filter(Boolean);
  } else if (typeof rolesRaw === 'string') {
    roles = rolesRaw ? [rolesRaw] : [];
  } else if (rolesRaw && typeof rolesRaw === 'object') {
    const maybeName = rolesRaw?.name ?? (rolesRaw?.id != null ? String(rolesRaw.id) : null);
    roles = maybeName ? [maybeName] : [];
  }

  // Business rule: user can only have one active role (super-admin/admin/mentor).
  // Sometimes the login payload may include more than one role; keep only the first unique one.
  if (Array.isArray(roles) && roles.length > 1) {
    roles = [...new Set(roles)].slice(0, 1);
  }

  return {
    ...userObj,
    id: userObj.id,
    name: userObj.name ?? userObj.name_ar ?? userObj.name_en ?? '',
    email: userObj.email ?? '',
    // UI expects snake_case field from API
    phone_number: userObj.phone_number ?? userObj.phoneNumber ?? null,
    roles,
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
