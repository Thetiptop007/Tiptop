import { apiRequest, parseApiResponse } from '../config/api';
import {
  CustomerUser,
  SignUpRequest,
  isCustomerAuthenticated as isCustomerAuthenticatedSnapshot,
  markCustomerAuthenticated,
  getCustomerAuthSnapshot,
  refreshCustomerProfile,
  refreshCustomerSession,
  resetCustomerAuthForLogin,
  isCustomerAuthBootComplete,
  waitForCustomerAuthBoot,
  CustomerLogoutReason,
  performCustomerLogoutWithReason,
} from './customer-auth.coordinator';
import { validateScopeSwitch, setAuthScope, forceLogout } from './auth-scope';
import { logger } from '../utils/logger';

export type { CustomerUser, SignUpRequest } from './customer-auth.coordinator';
export { CustomerLogoutReason } from './customer-auth.coordinator';

export interface LoginRequest {
  phone: string;
  password: string;
  role?: 'customer';
}

export interface LoginResponse {
  status: string;
  message: string;
  data: {
    user: CustomerUser;
    tokens?: {
      accessToken: string;
      expiresIn: string;
      csrfToken?: string;
    };
  };
}

export interface SignUpResponse {
  status: string;
  message: string;
  data: {
    user: CustomerUser;
    tokens?: {
      accessToken: string;
      expiresIn: string;
      csrfToken?: string;
    };
  };
}

const normalizeResponseError = (responseData: any, fallbackMessage: string) => {
  if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
    return responseData.errors
      .map((error: any) => error.message || error.msg || error)
      .filter(Boolean)
      .join('. ');
  }

  if (responseData?.message) {
    return responseData.message;
  }

  return fallbackMessage;
};

export const customerLogin = async (phone: string, password: string): Promise<LoginResponse> => {
  // CRITICAL: Validate scope before attempting login
  if (!validateScopeSwitch('customer')) {
    logger.error('Scope violation detected: attempting to login as customer while admin logged in', {
      currentScope: 'admin',
      requestedScope: 'customer',
    });

    // Force logout to clean state
    await forceLogout('scope_violation_customer_login');
    throw new Error('You are logged in as admin. Please log out first before switching to customer.');
  }

  resetCustomerAuthForLogin();

  const response = await apiRequest('auth/customer/login', {
    method: 'POST',
    body: JSON.stringify({
      email: phone,
      password,
    }),
  });

  const data = await parseApiResponse(response);

  // Check for mixed session error from backend
  if (data?.code === 'MIXED_SESSIONS' || data?.code === 'SCOPE_VIOLATION') {
    logger.error('Backend mixed session detected during login', {
      code: data.code,
      message: data.message,
    });

    // Force cleanup
    await forceLogout('backend_mixed_session_login');
    throw new Error(data.message || 'Mixed session detected. Please refresh and try again.');
  }

  if (data.status !== 'success' || !data.data?.user) {
    const message = normalizeResponseError(data, 'Login failed');
    throw new Error(message);
  }

  // Set auth scope on successful login
  setAuthScope('customer');

  markCustomerAuthenticated(data.data.user, {
    accessToken: data.data.tokens?.accessToken,
    csrfToken: data.data.tokens?.csrfToken || data.data.csrfToken,
  });

  logger.debug('Customer login completed and auth scope set');
  return data as LoginResponse;
};

export const customerSignUp = async (data: SignUpRequest): Promise<SignUpResponse> => {
  // CRITICAL: Validate scope before attempting signup
  if (!validateScopeSwitch('customer')) {
    logger.error('Scope violation detected: attempting to signup as customer while admin logged in', {
      currentScope: 'admin',
      requestedScope: 'customer',
    });

    // Force logout to clean state
    await forceLogout('scope_violation_customer_signup');
    throw new Error('You are logged in as admin. Please log out first before signing up as customer.');
  }

  resetCustomerAuthForLogin();

  const response = await apiRequest('auth/customer/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  const result = await parseApiResponse(response);

  // Check for mixed session error from backend
  if (result?.code === 'MIXED_SESSIONS' || result?.code === 'SCOPE_VIOLATION') {
    logger.error('Backend mixed session detected during signup', {
      code: result.code,
      message: result.message,
    });

    // Force cleanup
    await forceLogout('backend_mixed_session_signup');
    throw new Error(result.message || 'Mixed session detected. Please refresh and try again.');
  }

  if (result.status !== 'success' || !result.data?.user) {
    throw new Error(normalizeResponseError(result, 'Registration failed'));
  }

  // Set auth scope on successful signup
  setAuthScope('customer');

  markCustomerAuthenticated(result.data.user, {
    accessToken: result.data.tokens?.accessToken,
    csrfToken: result.data.tokens?.csrfToken || result.data.csrfToken,
  });

  return result as SignUpResponse;
};

export const customerLogout = async (): Promise<void> => {
  try {
    const response = await apiRequest('auth/customer/logout', {
      method: 'POST',
    });

    const data = await parseApiResponse(response);
    if (response.status >= 400) {
      throw new Error(normalizeResponseError(data, 'Logout failed'));
    }
  } finally {
    // Always clear all state with reason tracking, even if backend request fails
    performCustomerLogoutWithReason(CustomerLogoutReason.ManualLogout);
  }
};

export const getCustomerProfile = async (): Promise<CustomerUser> => {
  const outcome = await refreshCustomerProfile();

  if (outcome.status === 'success') {
    return outcome.customer;
  }

  throw new Error(outcome.message);
};

export const isCustomerAuthenticated = (): boolean => {
  return isCustomerAuthenticatedSnapshot();
};

export const getStoredCustomer = (): CustomerUser | null => {
  return getCustomerAuthSnapshot().customer;
};

export const refreshAccessToken = async (): Promise<string> => {
  const outcome = await refreshCustomerSession();

  if (outcome.status === 'success') {
    return outcome.accessToken;
  }

  throw new Error(outcome.message);
};

export const isCustomerAuthBootReady = (): boolean => isCustomerAuthBootComplete();

export const waitForCustomerAuthBootReady = (): Promise<boolean> => waitForCustomerAuthBoot();
