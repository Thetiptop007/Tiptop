import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useLocation } from 'react-router';
import { apiRequest, parseApiResponse } from '../config/api';
import { getCurrentUser } from '../services/auth.service';
import {
  broadcastAuthStateChange,
  clearAllAuthState,
  getAccessToken,
  getAuthUser,
  getAuthSyncPayload,
  addAuthSyncListener,
  validatePersistedAuth,
  setAccessToken,
  setCsrfToken,
  setAuthUser,
} from '../services/auth-session.store';
import { logger } from '../utils/logger';
import { useToast } from './ToastContext';

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
  const [authRevision, setAuthRevision] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const clearSession = () => {
    clearAllAuthState('admin');
    setUser(null);
  };

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      const payload = getAuthSyncPayload(event);
      if (!payload || payload.scope !== 'admin') {
        return;
      }

      if (payload.event === 'logout' || payload.event === 'invalidate') {
        clearSession();
        setIsLoading(false);
        if (location.pathname.startsWith('/admin')) {
          navigate('/signin', { replace: true });
        }
        return;
      }

      setAuthRevision((value) => value + 1);
    };

    const unsub = addAuthSyncListener((payload: any) => {
      if (!payload || payload.scope !== 'admin') return;
      if (payload.event === 'logout' || payload.event === 'invalidate') {
        clearSession();
        setIsLoading(false);
        if (location.pathname.startsWith('/admin')) {
          navigate('/signin', { replace: true });
        }
        return;
      }
      setAuthRevision((value) => value + 1);
    });

    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      try { unsub(); } catch {}
    };
  }, [location.pathname, navigate]);

  useEffect(() => {
    const bootstrapAuth = async () => {
      // Validate persisted localStorage state for admin before relying on it
      try {
        validatePersistedAuth('admin');
      } catch (e) {
        // best effort
      }

      // Phase 1: Check if we're on admin path
      const isAdminPath = location.pathname.startsWith('/admin');
      
      if (!isAdminPath) {
        // Not on admin path - don't attempt hydration
        setIsLoading(false);
        return;
      }

      // Phase 2: We're on admin path - boot in UNKNOWN state
      // IMPORTANT: Do NOT trust stale localStorage or in-memory cache
      // Always validate with backend
      
      logger.debug('Admin auth bootstrap started', {
        path: location.pathname,
        hasStoredToken: !!getAccessToken('admin'),
        hasStoredUser: !!getAuthUser('admin'),
      });

      const hasStoredAccessToken = !!getAccessToken('admin');

      if (!hasStoredAccessToken) {
        try {
          // Phase 3: No access token in memory, attempt refresh bootstrap once
          const refreshResponse = await apiRequest('auth/admin/refresh', {
            method: 'POST',
          });

          if (refreshResponse.status === 401 || refreshResponse.status === 403) {
            logger.warn('Admin refresh failed - session invalid', { status: refreshResponse.status });
            clearSession();
            broadcastAuthStateChange('admin', 'invalidate');
            setIsLoading(false);
            return;
          }

          if (!refreshResponse.ok) {
            logger.warn('Admin refresh failed - backend error', { status: refreshResponse.status });
            clearSession();
            setIsLoading(false);
            return;
          }

          const data = await parseApiResponse(refreshResponse);
          if (data.status === 'success' && data.data?.tokens?.accessToken) {
            setAccessToken('admin', data.data.tokens.accessToken);
            const csrfToken = data.data.csrfToken || data.data.tokens?.csrfToken;
            if (csrfToken) {
              setCsrfToken('admin', csrfToken);
            }
            if (data.data.user) {
              setAuthUser('admin', data.data.user);
            }
          }
        } catch (error: any) {
          logger.debug('Admin refresh bootstrap failed', { message: error?.message });
        }
      }

      try {
        // Phase 4: Fetch current authenticated user from backend
        const currentUser = await getCurrentUser();

        if (currentUser && currentUser.role === 'admin') {
          setUser({
            email: typeof currentUser.email === 'string' ? currentUser.email : currentUser.email.address,
            name: typeof currentUser.name === 'string' ? currentUser.name : `${currentUser.name.first} ${currentUser.name.last}`.trim(),
            role: currentUser.role,
          });
          setAuthUser('admin', currentUser);
        } else {
          logger.warn('Admin user not found or wrong role');
          clearSession();
          broadcastAuthStateChange('admin', 'invalidate');
        }
      } catch (error: any) {
        const errMsg = error?.message || 'Session validation failed';
        logger.warn('Admin getCurrentUser failed', { message: errMsg });
        clearSession();
        broadcastAuthStateChange('admin', 'invalidate');
        
        // Redirect only if on protected admin route
        if (location.pathname !== '/signin') {
          showToast('Your session has expired. Please log in again.', 'warning', 5000);
          navigate('/signin', { replace: true });
        }
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, [location.pathname, authRevision]);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiRequest('auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await parseApiResponse(response);

      if (response.ok && data.status === 'success' && data.data?.user) {
        clearSession();
        if (data.data.user.role !== 'admin') {
          return {
            success: false,
            message: 'Access denied. Admin privileges required.',
          };
        }

        const accessToken = data.data.tokens?.accessToken;
        const csrfToken = data.data.csrfToken || data.data.tokens?.csrfToken;
        const userEmail = typeof data.data.user.email === 'string' ? data.data.user.email : data.data.user.email?.address;
        const userName = typeof data.data.user.name === 'string' ? data.data.user.name : `${data.data.user.name.first} ${data.data.user.name.last}`.trim();
        const userRole = data.data.user.role;

        if (accessToken) {
          setAccessToken('admin', accessToken);
        }
        if (csrfToken) {
          setCsrfToken('admin', csrfToken);
        }
        setAuthUser('admin', data.data.user);
        setUser({
          email: userEmail,
          name: userName,
          role: userRole,
        });
        broadcastAuthStateChange('admin', 'login');

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
    // Attempt to notify backend, but don't wait
    apiRequest('auth/admin/logout', {
      method: 'POST',
    }).catch(() => logger.warn('Admin logout request failed'));

    // Clear all local state immediately
    clearSession();
    broadcastAuthStateChange('admin', 'logout');
    navigate('/signin', { replace: true });
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
