import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import api, { type User, type RegisterData, type LoginData } from '@/services/api';
import { clearAuthTokens } from '@/services/axiosClient';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  requestRegistrationCode: (email: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('access_token')
  );
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuthState = useCallback(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    setAccessToken(token);
    try {
      setUser(storedUser ? JSON.parse(storedUser) : null);
    } catch {
      setUser(null);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await api.auth.me();
      const responseData = response.data?.data || response.data;
      const userData = responseData?.user || responseData;
      if (userData) {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch {
      clearAuthTokens();
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'refresh_token' || e.key === 'user') {
        refreshAuthState();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshAuthState]);

  const login = async (email: string, password: string) => {
    const response = await api.auth.login({ email, password } as LoginData);
    const responseData = response.data?.data || response.data;
    const newAccessToken = responseData?.access_token;
    const newRefreshToken = responseData?.refresh_token;
    const userData = responseData?.user;
    
    if (!newAccessToken || !userData) {
      throw new Error('Invalid login response');
    }
    
    localStorage.setItem('access_token', newAccessToken);
    if (newRefreshToken) {
      localStorage.setItem('refresh_token', newRefreshToken);
    }
    localStorage.setItem('user', JSON.stringify(userData));
    
    setAccessToken(newAccessToken);
    setUser(userData);
  };

  const requestRegistrationCode = async (email: string) => {
    await api.auth.requestCode({ email });
  };

  const register = async (data: RegisterData) => {
    const response = await api.auth.register(data);
    const responseData = response.data?.data || response.data;
    
    if (responseData?.access_token) {
      const newAccessToken = responseData.access_token;
      const newRefreshToken = responseData.refresh_token;
      const userData = responseData.user;
      
      localStorage.setItem('access_token', newAccessToken);
      if (newRefreshToken) {
        localStorage.setItem('refresh_token', newRefreshToken);
      }
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
      setAccessToken(newAccessToken);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
    } finally {
      clearAuthTokens();
      setAccessToken(null);
      setUser(null);
      setLocation('/');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user && !!accessToken,
        login,
        requestRegistrationCode,
        register,
        logout,
        updateUser,
        refreshAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
