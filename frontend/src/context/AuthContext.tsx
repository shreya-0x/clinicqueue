import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../api';

interface AuthContextType {
  user: User | null;
  role: Role;
  token: string | null;
  loading: boolean;
  storageInfo: any;
  login: (email: string, pwd: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string; age?: number }) => Promise<void>;
  switchRole: (role: Role) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('clinicqueue_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [storageInfo, setStorageInfo] = useState<any>(null);

  const fetchHealthAndMe = async () => {
    try {
      // 1. Fetch backend health & storage status
      const health = await api.getHealth();
      setStorageInfo(health.storage);

      // 2. Fetch authenticated user if token exists
      const savedToken = localStorage.getItem('clinicqueue_token');
      if (savedToken) {
        const me = await api.getMe();
        setUser(me.user);
      } else {
        // Auto-initialize default patient session if no token exists
        const demoRes = await api.demoSwitch('patient');
        localStorage.setItem('clinicqueue_token', demoRes.token);
        setToken(demoRes.token);
        setUser(demoRes.user);
      }
    } catch (err) {
      console.warn('[AuthContext] Could not fetch session/health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthAndMe();
  }, []);

  const login = async (email: string, pwd: string) => {
    setLoading(true);
    try {
      const res = await api.login(email, pwd);
      localStorage.setItem('clinicqueue_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string; phone?: string; age?: number }) => {
    setLoading(true);
    try {
      const res = await api.register(data);
      localStorage.setItem('clinicqueue_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (targetRole: Role) => {
    setLoading(true);
    try {
      const res = await api.demoSwitch(targetRole);
      localStorage.setItem('clinicqueue_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } catch (err) {
      console.error('[AuthContext] Failed to switch demo role:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('clinicqueue_token');
    setToken(null);
    setUser(null);
    api.logout().catch(() => {});
  };

  const refreshUser = async () => {
    try {
      const me = await api.getMe();
      setUser(me.user);
    } catch (err) {
      console.warn('[AuthContext] Refresh user failed:', err);
    }
  };

  const role: Role = user?.role || 'patient';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        loading,
        storageInfo,
        login,
        register,
        switchRole,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
