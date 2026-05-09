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
import {
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

export interface CustomerAuthContextType {
  customer: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authReady: boolean;
  bootstrapAttempted: boolean;

  signUp: (data: SignUpRequest) => Promise<{ success: boolean; message?: string; user?: CustomerUser; autoLogin?: boolean }>;
  login: (phone: string, otp: string) => Promise<{ success: boolean; message?: string; user?: CustomerUser }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const useCustomerAuth = (): CustomerAuthContextType => {
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
        bootstrapAttempted: true,
        login: async () => ({ success: false, message: 'Customer auth is initializing', user: undefined }),
        signUp: async () => ({ success: false, message: 'Customer auth is initializing', user: undefined }),
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

  // Snapshot change tracking handled internally by coordinator

  useEffect(() => {
    bootstrapCustomerAuth(location.pathname).catch(() => {});
  }, []);

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


    // SYNC TO GLOBAL STORE (Don't clobber Admin if they are already there)
    const currentState = authStore.getState();
    const isAlreadyAdmin = currentState.role === 'admin' && currentState.user;

    if (snapshot.customer) {
      authStore.setState({
        user: snapshot.customer,
        role: 'customer',
        isAuthResolved: true,
        isAppReady: !snapshot.isLoading,
      });
    } else if (!isAlreadyAdmin) {
      // Only set to null if we aren't clobbering an active admin session
      authStore.setState({
        user: null,
        role: null,
        isAuthResolved: snapshot.bootstrapAttempted, 
        isAppReady: !snapshot.isLoading,
      });
    }
  }, [snapshot.customer, snapshot.bootstrapAttempted]);



  const signUp = async (data: SignUpRequest): Promise<{ success: boolean; message?: string; user?: CustomerUser; autoLogin?: boolean }> => {
    try {
      const result = await customerSignUp(data);
      const success = result.status === 'success';
      if (success) {
        await bootstrapCustomerAuth(location.pathname);
      }
      return { 
        success, 
        message: result.message, 
        user: result.data?.user,
        autoLogin: true
      };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Registration failed', user: undefined };
    }
  };

  const login = async (phone: string, otp: string): Promise<{ success: boolean; message?: string; user?: CustomerUser }> => {
    try {
      const result = await customerLogin(phone, otp);
      const success = result.status === 'success';
      if (success) {
        await bootstrapCustomerAuth(location.pathname);
      }
      return { 
        success, 
        message: result.message, 
        user: result.data?.user 
      };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Login failed', user: undefined };
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
    bootstrapAttempted: snapshot.bootstrapAttempted === true,

    signUp,
    login,
    logout,
    refreshProfile,
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
};
