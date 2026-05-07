import { createContext, useContext, useEffect, ReactNode, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router';
import { useLocation } from 'react-router';
import {
  customerLogin,
  customerSignUp,
  customerLogout,
  CustomerUser,
  SignUpRequest,
} from '../services/customer-auth.service';
import { requestFcmToken } from '../config/firebase';
import { apiRequest } from '../config/api';
import {
  getAccessToken,
  broadcastAuthStateChange,
  getAuthSyncPayload,
} from '../services/auth-session.store';
import {
  bootstrapCustomerAuth,
  clearCustomerSession,
  getCustomerAuthSnapshot,
  subscribeCustomerAuth,
} from '../services/customer-auth.coordinator';
import { authStore } from '../services/auth.store';
import { logger } from '../utils/logger';
import { useToast } from './ToastContext';

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authReady: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signUp: (data: SignUpRequest) => Promise<{ success: boolean; message?: string; user?: CustomerUser; autoLogin?: boolean }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    if (import.meta.env.DEV) {
      // In dev, return a safe stub to avoid runtime crashes in stories/tests,
      // but do not mark it as "loading" so UI buttons remain enabled.
      return {
        customer: null,
        isAuthenticated: false,
        isLoading: false,
        authReady: true,
        login: async () => ({ success: false, message: 'Customer auth is initializing' }),
        signUp: async () => ({ success: false, message: 'Customer auth is initializing' }),
        logout: async () => undefined,
        refreshProfile: async () => undefined,
      };
    }

    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }

  return context;
};

interface CustomerAuthProviderProps {
  children: ReactNode;
}

export const CustomerAuthProvider = ({ children }: CustomerAuthProviderProps) => {
  const snapshot = useSyncExternalStore(subscribeCustomerAuth, getCustomerAuthSnapshot, getCustomerAuthSnapshot);
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const registerFcmToken = async () => {
    try {
      const fcmToken = await requestFcmToken();
      const authToken = getAccessToken('customer');

      if (fcmToken && authToken) {
        await apiRequest('auth/customer/device-token', {
          method: 'POST',
          body: JSON.stringify({
            token: fcmToken,
            platform: 'web',
          }),
        });
      }
    } catch (error) {
      logger.warn('Failed to register FCM token');
    }
  };
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      const payload = getAuthSyncPayload(event);
      if (!payload || payload.scope !== 'customer') {
        return;
      }

      if (payload.event === 'logout' || payload.event === 'invalidate') {
        clearCustomerSession('invalidate', false);
        if (location.pathname.startsWith('/customer') && !location.pathname.includes('/login')) {
          navigate('/customer/login', { replace: true });
        }
        return;
      }

      void bootstrapCustomerAuth(location.pathname);
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [location.pathname, navigate]);

  useEffect(() => {
    // Always set full state, never skip (SINGLE SOURCE OF TRUTH)
    if (snapshot.customer) {
      authStore.setState({
        user: snapshot.customer,
        role: 'customer',
        isAuthResolved: true,
      });
    } else {
      authStore.setState({
        user: null,
        role: null,
        isAuthResolved: true,
      });
    }
  }, [snapshot.customer, snapshot.bootstrapAttempted]);

  const login = async (phone: string, password: string) => {
    try {
      const response = await customerLogin(phone, password);

      if (response.status === 'success' && response.data.user) {
        registerFcmToken().catch(() => logger.warn('FCM registration failed after login'));
        broadcastAuthStateChange('customer', 'login');
        return { success: true, message: 'Login successful' };
      }

      return { success: false, message: 'Login failed' };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  const signUp = async (data: SignUpRequest) => {
    try {
      const response = await customerSignUp(data);

      if (response.status === 'success' && response.data) {
        registerFcmToken().catch(() => logger.warn('FCM registration failed after signup'));
        broadcastAuthStateChange('customer', 'login');

        return {
          success: true,
          user: response.data.user,
          autoLogin: !!response.data.tokens?.accessToken,
          message: response.message || 'Registration successful! You are now logged in.',
        };
      }

      return { success: false, message: 'Registration failed' };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Registration failed. Please try again.',
      };
    }
  };

  const logout = async () => {
    try {
      await customerLogout();
    } catch (error: any) {
      logger.warn('Customer logout request failed', { message: error?.message });
    } finally {
      broadcastAuthStateChange('customer', 'logout');
      navigate('/customer/login', { replace: true });
    }
  };

  const refreshProfile = async () => {
    const outcome = await bootstrapCustomerAuth(location.pathname);

    if (outcome.status === 'terminal') {
      logger.error('Customer refreshProfile failed', { message: outcome.message });
      showToast('Your session has expired. Please log in again.', 'warning', 5000);
      clearCustomerSession('invalidate', true);
      if (!location.pathname.startsWith('/customer/login')) {
        navigate('/customer/login', { replace: true });
      }
    }
  };

  const value: CustomerAuthContextType = {
    customer: snapshot.customer,
    isAuthenticated: snapshot.status === 'authenticated' && !!snapshot.customer,
    isLoading: snapshot.isLoading,
    authReady: snapshot.bootstrapAttempted === true,
    login,
    signUp,
    logout,
    refreshProfile,
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
};
