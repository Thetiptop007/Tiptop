import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useLocation } from 'react-router';
import { apiRequest, parseApiResponse } from '../config/api';
import { getCsrfTokenForScope } from '../config/api';
import { getCurrentUser } from '../services/auth.service';
import { clearAccessToken, clearAuthUser, getAccessToken, getAuthUser, setAccessToken, setAuthUser } from '../services/auth-session.store';
import { logger } from '../utils/logger';

interface User {
  email: string;
  name: string;
  role: string;
  phone?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const clearSession = () => {
    clearAccessToken('admin');
    clearAuthUser('admin');
    setUser(null);
  };

  useEffect(() => {
    const bootstrapAuth = async () => {
      if (!location.pathname.startsWith('/admin')) {
        const storedUser = getAuthUser('admin') as { email?: string; name?: string; role?: string } | null;

        if (storedUser && getAccessToken('admin')) {
          setUser({
            email: storedUser.email || '',
            name: storedUser.name || '',
            role: storedUser.role || 'admin',
          });
        }

        setIsLoading(false);
        return;
      }

      if (getAccessToken('admin') && getAuthUser('admin')) {
        const storedUser = getAuthUser('admin') as { email?: string; name?: string; role?: string };
        setUser({
          email: storedUser.email || '',
          name: storedUser.name || '',
          role: storedUser.role || 'admin',
        });
        setIsLoading(false);
        return;
      }

      const csrfToken = getCsrfTokenForScope('admin');

      logger.debug('Admin auth bootstrap', {
        path: location.pathname,
        hasAccessToken: !!getAccessToken('admin'),
        hasStoredUser: !!getAuthUser('admin'),
        hasCsrfToken: !!csrfToken,
        csrfTokenPreview: csrfToken ? `${csrfToken.slice(0, 8)}...` : null,
      });

      try {
        const response = await apiRequest('auth/admin/refresh', {
          method: 'POST',
        });
        const data = await parseApiResponse(response);

        if (response.ok && data.status === 'success' && data.data?.tokens?.accessToken) {
          setAccessToken('admin', data.data.tokens.accessToken);
          if (data.data.user) {
            setAuthUser('admin', data.data.user);
          }
        }
      } catch (error) {
        logger.debug('Admin refresh bootstrap failed', { message: (error as Error)?.message });
      }

      try {
        const currentUser = await getCurrentUser();

        if (currentUser && currentUser.role === 'admin') {
          setUser({
            email: currentUser.email.address,
            name: `${currentUser.name.first} ${currentUser.name.last}`.trim(),
            role: currentUser.role,
          });
          setAuthUser('admin', currentUser);
        } else {
          clearSession();
        }
      } catch (error) {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, [location.pathname]);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiRequest('auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await parseApiResponse(response);

      if (response.ok && data.status === 'success' && data.data?.user) {
        if (data.data.user.role !== 'admin') {
          return {
            success: false,
            message: 'Access denied. Admin privileges required.',
          };
        }

        const accessToken = data.data.tokens?.accessToken;
        const userEmail = data.data.user.email?.address || data.data.user.email;
        const userName = `${data.data.user.name.first} ${data.data.user.name.last}`.trim();
        const userRole = data.data.user.role;

        if (accessToken) {
          setAccessToken('admin', accessToken);
        }
        setAuthUser('admin', data.data.user);
        setUser({
          email: userEmail,
          name: userName,
          role: userRole,
        });

        return { success: true };
      }

      return {
        success: false,
        message: data.message || 'Invalid email or password',
      };
    } catch (error) {
      logger.error('Admin login failed');
      return {
        success: false,
        message: 'Cannot connect to server. Please check your connection and try again.',
      };
    }
  };

  const logout = () => {
    apiRequest('auth/admin/logout', {
      method: 'POST',
    }).catch(() => logger.warn('Admin logout request failed'));

    clearSession();
    navigate('/signin');
  };

  const value = {
    user,
    isAuthenticated: !!user && !!getAccessToken('admin'),
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
