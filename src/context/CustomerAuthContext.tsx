import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useLocation } from 'react-router';
import { getCsrfTokenForScope } from '../config/api';
import {
  customerLogin,
  customerSignUp,
  customerLogout,
  getCustomerProfile,
  refreshAccessToken,
  CustomerUser,
  SignUpRequest,
} from '../services/customer-auth.service';
import { requestFcmToken } from '../config/firebase';
import { apiRequest } from '../config/api';
import { clearAccessToken, clearAuthUser, getAccessToken, setAuthUser } from '../services/auth-session.store';
import { logger } from '../utils/logger';

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signUp: (data: SignUpRequest) => Promise<{ success: boolean; message?: string; user?: CustomerUser; autoLogin?: boolean }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};

interface CustomerAuthProviderProps {
  children: ReactNode;
}

export const CustomerAuthProvider = ({ children }: CustomerAuthProviderProps) => {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const clearCustomerSession = () => {
    clearAccessToken('customer');
    clearAuthUser('customer');
    setCustomer(null);
  };

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
// i have made some changes in this file, please check the changes and let me know if you have any questions.
  useEffect(() => {
    const checkAuth = async () => {
      logger.debug('Checking customer authentication');

      if (!location.pathname.startsWith('/customer')) {
        if (customer && getAccessToken('customer')) {
          setCustomer(customer);
        }
        setIsLoading(false);
        return;
      }

      if (getAccessToken('customer') && customer) {
        setIsLoading(false);
        return;
      }

      const csrfToken = getCsrfTokenForScope('customer');

      logger.debug('Customer auth bootstrap', {
        path: location.pathname,
        hasAccessToken: !!getAccessToken('customer'),
        hasCustomer: !!customer,
        hasCsrfToken: !!csrfToken,
        csrfTokenPreview: csrfToken ? `${csrfToken.slice(0, 8)}...` : null,
      });

      if (!csrfToken) {
        setIsLoading(false);
        return;
      }

      try {
        await refreshAccessToken();
        const updatedProfile = await getCustomerProfile();
        setCustomer(updatedProfile);
        setAuthUser('customer', updatedProfile);
      } catch (error) {
        clearCustomerSession();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname]);

  const login = async (phone: string, password: string) => {
    try {
      const response = await customerLogin(phone, password);

      if (response.status === 'success' && response.data.user) {
        setCustomer(response.data.user);
        registerFcmToken().catch(() => logger.warn('FCM registration failed after login'));
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
        if (response.data.user) {
          setCustomer(response.data.user);
          setAuthUser('customer', response.data.user);
        }

        registerFcmToken().catch(() => logger.warn('FCM registration failed after signup'));

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
    } finally {
      clearCustomerSession();
      navigate('/customer/login');
    }
  };

  const refreshProfile = async () => {
    try {
      const updatedProfile = await getCustomerProfile();
      setCustomer(updatedProfile);
    } catch (error) {
      clearCustomerSession();
      if (!location.pathname.startsWith('/customer/login')) {
        navigate('/customer/login', { replace: true });
      }
    }
  };

  const value: CustomerAuthContextType = {
    customer,
    isAuthenticated: !!customer && !!getAccessToken('customer'),
    isLoading,
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
