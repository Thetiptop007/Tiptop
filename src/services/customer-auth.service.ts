/**
 * Customer Authentication Service
 * Uses the same backend API endpoints as the mobile app
 */

import { apiRequest, parseApiResponse } from '../config/api';
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
    accessToken: string;
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
    tokens: {
      accessToken: string;
      expiresIn: string;
    };
  };
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface VerifyOTPResponse {
  status: string;
  message: string;
  data: {
    user: CustomerUser;
    accessToken: string;
  };
}

/**
 * Customer login
 */
export const customerLogin = async (phone: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await apiRequest('auth/login', {
      method: 'POST',
      headers: {
        'X-Auth-Scope': 'customer',
      },
      body: JSON.stringify({
        email: phone,  // Backend expects 'email' field for phone OR email
        password,
      })
    });

    const data = await parseApiResponse(response);
    
    if (data.status === 'success' && data.data) {
      // Store tokens and user data (tokens are nested in data.tokens)
      const accessToken = data.data.tokens?.accessToken || data.data.accessToken;
      
      localStorage.setItem('customerToken', accessToken);
      localStorage.setItem('customerUser', JSON.stringify(data.data.user));
      logger.debug('Customer tokens persisted after login');
      
      return data as LoginResponse;
    }

    // Log validation errors for debugging
    if (data.error) {
      logger.warn('Customer login API returned error payload');
      // Handle array of errors or single error
      if (Array.isArray(data.error)) {
        const errorMessages = data.error.map((err: any) => err.message || err.msg || err).join(', ');
        throw new Error(errorMessages || data.message || 'Login failed');
      } else if (typeof data.error === 'object' && data.error.message) {
        throw new Error(data.error.message || data.message || 'Login failed');
      } else if (typeof data.error === 'string') {
        throw new Error(data.error || data.message || 'Login failed');
      } else {
        throw new Error(data.message || 'Login failed');
      }
    }

    throw new Error(data.message || 'Login failed');
  } catch (error: any) {
    logger.error('Customer login request failed');
    // Make sure we always throw a proper Error with a string message
    if (error instanceof Error) {
      throw error;
    } else if (typeof error === 'string') {
      throw new Error(error);
    } else if (error?.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Login failed. Please try again.');
    }
  }
};

/**
 * Customer signup/register
 */
export const customerSignUp = async (data: SignUpRequest): Promise<SignUpResponse> => {
  try {
    logger.debug('Customer signup request started');
    
    const response = await apiRequest('auth/register', {
      method: 'POST',
      headers: {
        'X-Auth-Scope': 'customer',
      },
      body: JSON.stringify(data)
    });

    const result = await parseApiResponse(response);
    
    if (result.status === 'success' && result.data) {
      logger.info('Customer signup successful');
      
      // Store tokens and user data (auto-login after registration)
      if (result.data.tokens && result.data.user) {
        localStorage.setItem('customerToken', result.data.tokens.accessToken);
        localStorage.setItem('customerUser', JSON.stringify(result.data.user));
        logger.debug('Customer auth persisted after signup');
      }
      
      return result as SignUpResponse;
    }

    // Handle validation errors
    if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
      logger.warn('Customer signup validation failed');
      const errorMessages = result.errors
        .map((err: any) => err.message || err.msg)
        .filter(Boolean);
      
      if (errorMessages.length > 0) {
        throw new Error(errorMessages.join('. '));
      }
    }

    logger.warn('Customer signup failed');
    throw new Error(result.message || 'Registration failed');
  } catch (error: any) {
    logger.error('Customer signup request failed');
    // Make sure we always throw a proper Error with a string message
    if (error instanceof Error) {
      throw error;
    } else if (typeof error === 'string') {
      throw new Error(error);
    } else if (error?.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Registration failed. Please try again.');
    }
  }
};

/**
 * Verify email with OTP
 */
export const verifyOTP = async (email: string, otp: string): Promise<VerifyOTPResponse> => {
  try {
    const response = await apiRequest('auth/verify-otp', {
      method: 'POST',
      headers: {
        'X-Auth-Scope': 'customer',
      },
      body: JSON.stringify({ email, otp })
    });

    const data = await parseApiResponse(response);
    
    if (data.status === 'success' && data.data) {
      // Store tokens and user data after verification (tokens are nested in data.tokens)
      const accessToken = data.data.tokens?.accessToken || data.data.accessToken;
      
      localStorage.setItem('customerToken', accessToken);
      localStorage.setItem('customerUser', JSON.stringify(data.data.user));
      logger.debug('Customer tokens persisted after OTP verification');
      
      return data as VerifyOTPResponse;
    }

    throw new Error(data.message || 'OTP verification failed');
  } catch (error: any) {
    logger.error('Customer OTP verification request failed');
    // Make sure we always throw a proper Error with a string message
    if (error instanceof Error) {
      throw error;
    } else if (typeof error === 'string') {
      throw new Error(error);
    } else if (error?.message) {
      throw new Error(error.message);
    } else {
      throw new Error('OTP verification failed. Please try again.');
    }
  }
};

/**
 * Resend OTP
 */
export const resendOTP = async (email: string): Promise<{ status: string; message?: string }> => {
  try {
    const response = await apiRequest('auth/resend-otp', {
      method: 'POST',
      headers: {
        'X-Auth-Scope': 'customer',
      },
      body: JSON.stringify({ email })
    });

    return await parseApiResponse(response);
  } catch (error: any) {
    logger.error('Customer OTP resend request failed');
    // Make sure we always throw a proper Error with a string message
    if (error instanceof Error) {
      throw error;
    } else if (typeof error === 'string') {
      throw new Error(error);
    } else if (error?.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to resend OTP. Please try again.');
    }
  }
};

/**
 * Customer logout
 */
export const customerLogout = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('customerToken');
    
    if (token) {
      await apiRequest('auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Auth-Scope': 'customer',
        },
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear local storage regardless of API call success
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUser');
  }
};

/**
 * Get current customer profile
 */
export const getCustomerProfile = async (): Promise<CustomerUser> => {
  try {
    const token = localStorage.getItem('customerToken');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await apiRequest('auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await parseApiResponse(response);
    
    // Check if response status is 401
    if (response.status === 401) {
      throw new Error('Invalid token. Please log in again.');
    }
    
    if (data.status === 'success' && data.data?.user) {
      // Update stored user data
      localStorage.setItem('customerUser', JSON.stringify(data.data.user));
      return data.data.user;
    }

    throw new Error(data.message || 'Failed to fetch profile');
  } catch (error: any) {
    console.error('Get profile error:', error);
    throw error;
  }
};

/**
 * Check if customer is authenticated
 */
export const isCustomerAuthenticated = (): boolean => {
  const token = localStorage.getItem('customerToken');
  const user = localStorage.getItem('customerUser');
  return !!(token && user);
};

/**
 * Get stored customer data
 */
export const getStoredCustomer = (): CustomerUser | null => {
  try {
    const userStr = localStorage.getItem('customerUser');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (): Promise<string> => {
  try {
    const response = await apiRequest('auth/refresh-token', {
      method: 'POST',
      headers: {
        'X-Auth-Scope': 'customer',
      },
    });

    const data = await parseApiResponse(response);
    
    if (data.status === 'success' && data.data?.accessToken) {
      localStorage.setItem('customerToken', data.data.accessToken);
      return data.data.accessToken;
    }

    throw new Error('Token refresh failed');
  } catch (error: any) {
    console.error('Token refresh error:', error);
    // Clear tokens on refresh failure
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUser');
    throw error;
  }
};
