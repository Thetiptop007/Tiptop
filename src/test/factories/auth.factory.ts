import { vi } from 'vitest';
import * as authStore from '../../services/auth-session.store';

/**
 * Reusable auth helpers for frontend tests
 */
export const loginAsAdmin = () => {
  authStore.setAccessToken('admin', 'test-admin-token');
  authStore.setCsrfToken('admin', 'test-admin-csrf');
  authStore.setAuthUser('admin', { _id: 'admin123', role: 'admin' });
};

export const loginAsCustomer = () => {
  authStore.setAccessToken('customer', 'test-customer-token');
  authStore.setCsrfToken('customer', 'test-customer-csrf');
  authStore.setAuthUser('customer', { _id: 'customer123', role: 'customer' });
};

export const clearAllAuth = () => {
  authStore.clearAllAuthState();
};

export const simulateExpiredToken = (scope: 'admin' | 'customer') => {
  // We can simulate an expired token by either clearing it or 
  // setting up an MSW handler that returns 401
  authStore.setAccessToken(scope, 'expired-token');
};
