import { createContext, useCallback, useEffect, useState } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('collabx_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('collabx_token'));
  const [loading, setLoading] = useState(Boolean(token));

  // Re-fetch user on mount if we have a token
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/users/me');
        if (!cancelled) {
          setUser(data.user);
          localStorage.setItem('collabx_user', JSON.stringify(data.user));
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem('collabx_token');
          localStorage.removeItem('collabx_user');
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(async ({ identifier, password }) => {
    const { data } = await api.post('/auth/login', { identifier, password });
    localStorage.setItem('collabx_token', data.token);
    localStorage.setItem('collabx_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async ({ username, email, password, githubUsername }) => {
    const { data } = await api.post('/auth/register', {
      username,
      email,
      password,
      githubUsername,
    });
    localStorage.setItem('collabx_token', data.token);
    localStorage.setItem('collabx_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('collabx_token');
    localStorage.removeItem('collabx_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/users/me');
    setUser(data.user);
    localStorage.setItem('collabx_user', JSON.stringify(data.user));
    return data.user;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(token && user),
        isProfileComplete: Boolean(user?.isProfileComplete),
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}