import { useState } from 'react';
import { apiRequest, parseApiResponse } from '../config/api';
import {
  clearAllAuthState,
  setAccessToken,
  setCsrfToken,
  setSessionId,
  setAuthUser,
} from '../services/auth-session.store';
import { authStore } from '../services/auth.store';
import { setAuthScope } from '../services/auth-scope';
import { setAdminUserManually } from '../services/admin-auth.coordinator';
import { logger } from '../utils/logger';

export function useAdminAuthActions() {
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      // Clear any existing customer session silently before logging in as admin
      if (authStore.getState().role === 'customer') {
        clearAllAuthState('customer');
        authStore.reset();
        
        // Wipe backend customer session
        try {
          const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
          await fetch(`${apiBase}/auth/customer/logout`, { method: 'POST', credentials: 'include' });
        } catch (e) {
          // ignore
        }
      }

      const response = await apiRequest('auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await parseApiResponse(response);

      if (response.ok && data.status === 'success' && data.data?.user) {
        // Clear old local state entirely before setting new
        clearAllAuthState('admin');
        
        if (data.data.user.role !== 'admin') {
          return {
            success: false,
            message: 'Access denied. Admin privileges required.',
          };
        }

        const accessToken = data.data.tokens?.accessToken;
        const csrfToken = data.data.csrfToken || data.data.tokens?.csrfToken;
        const sessionId = data.data.tokens?.sessionId;

        if (accessToken) setAccessToken('admin', accessToken);
        if (csrfToken) setCsrfToken('admin', csrfToken);
        if (sessionId) setSessionId('admin', sessionId);

        setAuthScope('admin');
        setAuthUser('admin', data.data.user);
        
        // Inject user into coordinator immediately so AuthContext resolves instantly
        setAdminUserManually(data.data.user);

        // Reset app readiness so protected routes block rendering until hydration completes
        authStore.setState({ isAppReady: true }); // Set to true since we just manually hydrated!

        // Note: we do NOT call bootstrapAdminAuth() here.
        // It will be called automatically when the protected `<AuthProvider>` mounts
        // after the user is redirected to the admin dashboard.
        
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
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading };
}
