import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types/api.types';
import { LoginCredentials } from '../types/auth.types';
import { authApi } from '../api/auth.api';
import { REFRESH_TOKEN_KEY } from '../lib/constants';
import { setAccessToken } from '../api/axios';
import { useToast } from '../hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        try {
          // Getting profile will trigger the auto-refresh interceptor in axios.ts if we don't have access token
          // Wait, actually our interceptor only fires on 401. If we have NO access token initially,
          // the first request will fail with 401 and THEN it will refresh.
          const userData = await authApi.getProfile();
          setUser(userData);
        } catch (error) {
          console.error('Auth init failed:', error);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          setAccessToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const data = await authApi.login(credentials);
      setUser(data.data.user);
      setAccessToken(data.data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.data.refreshToken);
      toast({ title: 'Logged in successfully' });
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.response?.data?.message || 'An error occurred',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (error) {
        console.error('Logout API failed:', error);
      }
    }
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
