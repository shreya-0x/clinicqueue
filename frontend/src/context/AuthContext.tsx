import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../api';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  token: string | null;
  loading: boolean;
  storageInfo: any;
  login: (email: string, pwd: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; phone?: string; age?: number; gender?: string }) => Promise<User>;
  switchRole: (role: Role) => Promise<User>;
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
      try {
        const health = await api.getHealth();
        setStorageInfo(health.storage);
      } catch (hErr) {
        console.warn('[AuthContext] Backend health probe warning:', hErr);
      }

      // 2. Fetch authenticated user if token exists
      const savedToken = localStorage.getItem('clinicqueue_token');
      if (savedToken) {
        try {
          const me = await api.getMe();
          setUser(me.user);
          setToken(savedToken);
        } catch (meErr) {
          // Token expired or invalid
          console.warn('[AuthContext] Stored token invalid or expired, resetting session.');
          localStorage.removeItem('clinicqueue_token');
          setToken(null);
          setUser(null);
        }
      } else {
        setToken(null);
        setUser(null);
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

  const login = async (email: string, pwd: string): Promise<User> => {
    setLoading(true);
    try {
      const res = await api.login(email, pwd);
      localStorage.setItem('clinicqueue_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string; phone?: string; age?: number; gender?: string }): Promise<User> => {
    setLoading(true);
    try {
      const res = await api.register(data);
      localStorage.setItem('clinicqueue_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (targetRole: Role): Promise<User> => {
    setLoading(true);
    try {
      const res = await api.demoSwitch(targetRole);
      localStorage.setItem('clinicqueue_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
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

  const role: Role | null = user?.role || null;

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
