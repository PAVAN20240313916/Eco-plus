import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ecopulse_org');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('ecopulse_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authAPI.getMe();
        if (res.data?.success && res.data.organization) {
          const org = res.data.organization;
          const normalized = {
            id: org.id,
            name: org.name,
            email: org.email,
            businessType: org.businessType || org.business_type
          };
          setUser(normalized);
          localStorage.setItem('ecopulse_org', JSON.stringify(normalized));
        }
      } catch {
        localStorage.removeItem('ecopulse_token');
        localStorage.removeItem('ecopulse_org');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    verifySession();
  }, [token]);

  const persistSession = (newToken, org) => {
    const normalized = {
      id: org.id,
      name: org.name,
      email: org.email,
      businessType: org.businessType || org.business_type
    };
    localStorage.setItem('ecopulse_token', newToken);
    localStorage.setItem('ecopulse_org', JSON.stringify(normalized));
    setToken(newToken);
    setUser(normalized);
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    persistSession(res.data.token, res.data.organization);
    return res.data;
  };

  const register = async ({ name, email, password, businessType }) => {
    const res = await authAPI.register({ name, email, password, businessType });
    persistSession(res.data.token, res.data.organization);
    return res.data;
  };

  const loginDemo = async () => {
    return login('demo@ecopulse.io', 'password123');
  };

  const logout = () => {
    localStorage.removeItem('ecopulse_token');
    localStorage.removeItem('ecopulse_org');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        loading,
        login,
        register,
        loginDemo,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
