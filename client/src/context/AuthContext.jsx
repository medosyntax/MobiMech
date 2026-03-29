import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('mobimech_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mobimech_token');
    if (token) {
      api.getMe()
        .then((u) => {
          setUser(u);
          localStorage.setItem('mobimech_user', JSON.stringify(u));
        })
        .catch(() => {
          localStorage.removeItem('mobimech_token');
          localStorage.removeItem('mobimech_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const data = await api.login({ username, password });
    localStorage.setItem('mobimech_token', data.token);
    localStorage.setItem('mobimech_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('mobimech_token');
    localStorage.removeItem('mobimech_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
