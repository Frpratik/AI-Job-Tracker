'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, tokenStorage } from '@/lib/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (data: {
    target_role: string;
    preferred_locations: string[];
    experience_level: string;
    work_preference: string;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const access = tokenStorage.getAccess();
    if (!access) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await api.get<User>('/auth/me/');
      setUser(userData);
    } catch {
      tokenStorage.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.post<{ user: User; tokens: { access: string; refresh: string } }>(
        '/auth/login/',
        { email, password }
      );
      tokenStorage.setTokens(data.tokens.access, data.tokens.refresh);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.post<{ user: User; tokens: { access: string; refresh: string } }>(
        '/auth/register/',
        {
          full_name: name,
          email,
          password,
          confirm_password: password,
        }
      );
      tokenStorage.setTokens(data.tokens.access, data.tokens.refresh);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refresh = tokenStorage.getRefresh();
    try {
      if (refresh) {
        await api.post('/auth/logout/', { refresh });
      }
    } catch {
      // Ignore logout backend errors
    } finally {
      tokenStorage.clear();
      setUser(null);
      window.location.href = '/login';
    }
  };

  const completeOnboarding = async (data: {
    target_role: string;
    preferred_locations: string[];
    experience_level: string;
    work_preference: string;
  }) => {
    const updated = await api.patch<User>('/auth/me/', {
      profile: {
        ...data,
        onboarding_completed: true,
      },
    });
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        completeOnboarding,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
