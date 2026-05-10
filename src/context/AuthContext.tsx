import { createContext, useContext, useState, useEffect, ReactNode, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router';
import { useLocation } from 'react-router';
import { apiRequest, parseApiResponse } from '../config/api';
import {
  broadcastAuthStateChange,
  clearAllAuthState,
  getAuthSyncPayload,
  addAuthSyncListener,
  setAccessToken,
  setCsrfToken,
  setSessionId,
  setAuthUser,
} from '../services/auth-session.store';
import {
  bootstrapAdminAuth,
  getAdminAuthSnapshot,
  subscribeAdminAuth,
  clearAdminAuthCache,
} from '../services/admin-auth.coordinator';
import { appQueryClient } from '../config/queryClient';
import { appQueryKeys } from '../hooks/useAppDataQueries';
import { authStore } from '../services/auth.store';
import { validateScopeSwitch, setAuthScope, forceLogout } from '../services/auth-scope';
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
  authReady: boolean;

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
  // Use external store (coordinator) for auth state - prevents duplicate /auth/me calls
  const coordinatorSnapshot = useSyncExternalStore(subscribeAdminAuth, getAdminAuthSnapshot, getAdminAuthSnapshot);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    bootstrapAdminAuth().catch(() => {});
  }, []);

  const clearSession = () => {
    clearAllAuthState('admin');
    clearAdminAuthCache();
    setUser(null);
  };

  // Sync coordinator state to local state (SINGLE SOURCE OF TRUTH)
  useEffect(() => {
    
    if (coordinatorSnapshot.user) {
      // Normalize admin user shape so UI (react-query + components) can consume a consistent structure
      const raw = coordinatorSnapshot.user as any;
      const normalized = {
        _id: raw._id || raw.id,
        name: typeof raw.name === 'string'
          ? { first: raw.name.split(' ')[0] || '', last: raw.name.split(' ').slice(1).join(' ') || '' }
          : raw.name || { first: '', last: '' },
        email: typeof raw.email === 'string' ? { address: raw.email, isVerified: false } : raw.email || { address: '', isVerified: false },
        phone: typeof raw.phone === 'string' ? { number: raw.phone, isVerified: false } : raw.phone || undefined,
        role: raw.role,
        isActive: raw.isActive,
      } as any;

      // Keep local simplified AuthContext user (string name) for consumers of useAuth()
      setUser({
        email: typeof raw.email === 'string' ? raw.email : raw.email?.address,
        name: typeof raw.name === 'string' ? raw.name : `${raw.name?.first || ''} ${raw.name?.last || ''}`.trim(),
        role: raw.role,
        phone: typeof raw.phone === 'string' ? raw.phone : raw.phone?.number,
      });

      // Always set canonical user into the auth store and session store
      setAuthUser('admin', normalized);
      authStore.setState({
        user: normalized,
        role: 'admin',
        isAuthResolved: true,
        isAppReady: !coordinatorSnapshot.isLoading, // Hydration complete
      });

      // Update react-query cache for current-user so UI components that rely on queries see data immediately
      try {
        appQueryClient.setQueryData(appQueryKeys.currentUser, normalized);
      } catch (e) {
        // Swallow - optional optimization
      }
    } else {
      setUser(null);

      // SYNC TO GLOBAL STORE (Don't clobber Customer if they are already there)
      const currentState = authStore.getState();
      const isAlreadyCustomer = currentState.role === 'customer' && currentState.user;

      if (!isAlreadyCustomer) {
        authStore.setState({
          user: null,
          role: null,
          isAuthResolved: !coordinatorSnapshot.isLoading, 
          isAppReady: !coordinatorSnapshot.isLoading, 
        });
      } else {
        // If we are already a customer, we just mark auth as resolved globally
        authStore.setState({
          isAuthResolved: true,
          isAppReady: true
        });
      }
    }
  }, [coordinatorSnapshot.user, coordinatorSnapshot.isLoading]);

  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      const payload = getAuthSyncPayload(event);
      if (!payload || payload.scope !== 'admin') {
        return;
      }

      if (payload.event === 'logout' || payload.event === 'invalidate') {
        clearSession();
        if (location.pathname.startsWith('/admin')) {
          navigate('/signin', { replace: true });
        }
        return;
      }
    };

    const unsub = addAuthSyncListener((payload: any) => {
      if (!payload || payload.scope !== 'admin') return;
      if (payload.event === 'logout' || payload.event === 'invalidate') {
        clearSession();
        if (location.pathname.startsWith('/admin')) {
          navigate('/signin', { replace: true });
        }
        return;
      }
    });

    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      try { unsub(); } catch {}
    };
  }, [location.pathname, navigate]);



  const logout = () => {
    // Attempt to notify backend, but don't wait
    apiRequest('auth/admin/logout', {
      method: 'POST',
    }).catch(() => logger.warn('Admin logout request failed'));

    // Clear all local state immediately
    clearSession();
    
    // CRITICAL: Clear auth scope on logout
    setAuthScope(null);
    
    broadcastAuthStateChange('admin', 'logout');
    navigate('/signin', { replace: true });
  };

  const value = {
    user: (coordinatorSnapshot.user as User | null),
    isAuthenticated: coordinatorSnapshot.isAuthenticated,
    isLoading: coordinatorSnapshot.isLoading,
    authReady: coordinatorSnapshot.user !== null || (coordinatorSnapshot.isLoading === false && coordinatorSnapshot.user === null),
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
