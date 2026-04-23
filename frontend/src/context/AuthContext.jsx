import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../api/userApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('rxpulse_token');
    const storedUser = localStorage.getItem('rxpulse_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    const { token: t, user: u } = res.data.data;
    setToken(t);
    setUser(u);
    localStorage.setItem('rxpulse_token', t);
    localStorage.setItem('rxpulse_user', JSON.stringify(u));
    return u;
  };

  const register = async (formData) => {
    const res = await registerUser(formData);
    const { token: t, user: u } = res.data.data;
    setToken(t);
    setUser(u);
    localStorage.setItem('rxpulse_token', t);
    localStorage.setItem('rxpulse_user', JSON.stringify(u));
    return u;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('rxpulse_token');
    localStorage.removeItem('rxpulse_user');
    localStorage.removeItem('rxpulse_cart');
  };

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
