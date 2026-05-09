import { useState } from 'react';
import { customerLogin, customerSignUp, SignUpRequest } from '../services/customer-auth.service';
import { apiRequest } from '../config/api';
import {
  clearAllAuthState,
  getAccessToken,
  broadcastAuthStateChange
} from '../services/auth-session.store';
import { authStore } from '../services/auth.store';
import { requestFcmToken } from '../config/firebase';
import { markCustomerAuthenticated } from '../services/customer-auth.coordinator';
import { logger } from '../utils/logger';

export function useCustomerAuthActions() {
  const [isLoading, setIsLoading] = useState(false);

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

  const login = async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      if (authStore.getState().role === 'admin') {
        clearAllAuthState('admin');
        authStore.reset();
        
        try {
          const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
          await fetch(`${apiBase}/auth/admin/logout`, { method: 'POST', credentials: 'include' });
        } catch (e) {
          // ignore
        }
      }

      const response = await customerLogin(phone, password);

      if (response.status === 'success' && response.data.user) {
        registerFcmToken().catch(() => logger.warn('FCM registration failed after login'));
        
        // Inject user into coordinator immediately so CustomerAuthContext resolves instantly
        markCustomerAuthenticated(response.data.user);
        
        broadcastAuthStateChange('customer', 'login');
        authStore.setState({ isAppReady: true }); // Set to true since we just manually hydrated!
        return { success: true, message: 'Login successful', user: response.data.user };
      }

      return { success: false, message: 'Login failed', user: undefined };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Login failed. Please check your credentials.',
        user: undefined
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: SignUpRequest) => {
    setIsLoading(true);
    try {
      if (authStore.getState().role === 'admin') {
        clearAllAuthState('admin');
        authStore.reset();
        
        try {
          const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
          await fetch(`${apiBase}/auth/admin/logout`, { method: 'POST', credentials: 'include' });
        } catch (e) {
          // ignore
        }
      }

      const response = await customerSignUp(data);

      if (response.status === 'success' && response.data?.user) {
        registerFcmToken().catch(() => logger.warn('FCM registration failed after signup'));
        
        // Inject user into coordinator immediately so CustomerAuthContext resolves instantly
        markCustomerAuthenticated(response.data.user);

        broadcastAuthStateChange('customer', 'login');
        authStore.setState({ isAppReady: true }); // Set to true since we just manually hydrated!
        return { success: true, message: 'Signup successful', user: response.data.user, autoLogin: true };
      }

      return { success: false, message: 'Signup failed', user: undefined };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Signup failed. Please try again.',
        user: undefined
      };
    } finally {
      setIsLoading(false);
    }
  };

  return { login, signUp, isLoading };
}
