import { apiRequest, parseApiResponse } from '../config/api';
import {
  clearAccessToken,
  clearAuthUser,
  clearCsrfToken,
  getAccessToken,
  getAuthUser,
  setAccessToken,
  setCsrfToken,
  setAuthUser,
} from './auth-session.store';
import { logger } from '../utils/logger';

export interface CustomerUser {
  _id: string;
  email: {
    address: string;
    isVerified: boolean;
  };
  phone: {
    number: string;
    isVerified: boolean;
  };
  name: {
    first: string;
    last: string;
  };
  role: string;
  isActive: boolean;
  customerData?: {
    totalOrders: number;
    totalSpent: number;
    favoriteItems: string[];
  };
}

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

export interface SignUpRequest {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: 'customer';
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
  const response = await apiRequest('auth/customer/login', {
    method: 'POST',
    body: JSON.stringify({
      email: phone,
      password,
    }),
  });

  const data = await parseApiResponse(response);

  if (data.status !== 'success' || !data.data?.user) {
    const message = normalizeResponseError(data, 'Login failed');
    throw new Error(message);
  }

  const accessToken = data.data.tokens?.accessToken;
  if (accessToken) {
    setAccessToken('customer', accessToken);
  }
  const csrfToken = data.data.tokens?.csrfToken || data.data.csrfToken;
  if (csrfToken) {
    setCsrfToken('customer', csrfToken);
  }
  setAuthUser('customer', data.data.user);

  logger.debug('Customer login completed');
  return data as LoginResponse;
};

export const customerSignUp = async (data: SignUpRequest): Promise<SignUpResponse> => {
  const response = await apiRequest('auth/customer/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  const result = await parseApiResponse(response);

  if (result.status !== 'success' || !result.data?.user) {
    throw new Error(normalizeResponseError(result, 'Registration failed'));
  }

  if (result.data.tokens?.accessToken) {
    setAccessToken('customer', result.data.tokens.accessToken);
    setAuthUser('customer', result.data.user);
  }
  const csrfToken = result.data.tokens?.csrfToken || result.data.csrfToken;
  if (csrfToken) {
    setCsrfToken('customer', csrfToken);
  }

  return result as SignUpResponse;
};

export const customerLogout = async (): Promise<void> => {
  const response = await apiRequest('auth/customer/logout', {
    method: 'POST',
  });

  const data = await parseApiResponse(response);
  if (response.status >= 400) {
    throw new Error(normalizeResponseError(data, 'Logout failed'));
  }

  clearAccessToken('customer');
  clearAuthUser('customer');
  clearCsrfToken('customer');
};

export const getCustomerProfile = async (): Promise<CustomerUser> => {
  const response = await apiRequest('auth/customer/me');
  const data = await parseApiResponse(response);

  if (response.status === 401) {
    throw new Error(data.message || 'Invalid token. Please log in again.');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch profile');
  }

  if (data.status === 'success' && data.data?.user) {
    setAuthUser('customer', data.data.user);
    return data.data.user;
  }

  throw new Error(data.message || 'Failed to fetch profile');
};

export const isCustomerAuthenticated = (): boolean => {
  return !!getAccessToken('customer') && !!getAuthUser('customer');
};

export const getStoredCustomer = (): CustomerUser | null => {
  return (getAuthUser('customer') as CustomerUser | null) || null;
};

export const refreshAccessToken = async (): Promise<string> => {
  const response = await apiRequest('auth/customer/refresh', {
    method: 'POST',
  });

  const data = await parseApiResponse(response);

  if (data.status === 'success' && data.data?.tokens?.accessToken) {
    setAccessToken('customer', data.data.tokens.accessToken);
    const csrfToken = data.data?.csrfToken || data.data?.tokens?.csrfToken;
    if (csrfToken) {
      setCsrfToken('customer', csrfToken);
    }
    if (data.data.user) {
      setAuthUser('customer', data.data.user);
    }
    return data.data.tokens.accessToken;
  }

  clearAccessToken('customer');
  clearAuthUser('customer');
  throw new Error(normalizeResponseError(data, 'Token refresh failed'));
};
