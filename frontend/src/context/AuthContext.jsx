import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, login as loginRequest } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('ems_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ems_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(Boolean(token && !user));

  useEffect(() => {
    if (!token || user) {
      setLoading(false);
      return;
    }
    getMe()
      .then((profile) => {
        setUser(profile);
        localStorage.setItem('ems_user', JSON.stringify(profile));
      })
      .finally(() => setLoading(false));
  }, [token, user]);

  const login = async (credentials) => {
    const data = await loginRequest(credentials);
    localStorage.setItem('ems_token', data.access_token);
    localStorage.setItem('ems_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('ems_token');
    localStorage.removeItem('ems_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (profile) => {
    localStorage.setItem('ems_user', JSON.stringify(profile));
    setUser(profile);
  };

  const value = useMemo(() => ({ token, user, loading, login, logout, updateUser }), [token, user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
