/**
 * Customer Authentication Service
 * Uses the same backend API endpoints as the mobile app
 */

import { apiRequest, parseApiResponse } from '../config/api';

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
    refreshToken: string;
  };
}

export interface SignUpRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'customer';
}

export interface SignUpResponse {
  status: string;
  message: string;
  data: {
    userId: string;
    email: string;
    otpSent: boolean;
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
    refreshToken: string;
  };
}

/**
 * Customer login
 */
export const customerLogin = async (phone: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await apiRequest('auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: phone,  // Backend expects 'email' field for phone OR email
        password,
      })
    });

    const data = await parseApiResponse(response);
    
    if (data.status === 'success' && data.data) {
      // Store tokens and user data
      localStorage.setItem('customerToken', data.data.accessToken);
      localStorage.setItem('customerRefreshToken', data.data.refreshToken);
      localStorage.setItem('customerUser', JSON.stringify(data.data.user));
      
      return data as LoginResponse;
    }

    // Log validation errors for debugging
    if (data.error) {
      console.error('Login error:', data.error);
      // Handle array of errors or single error
      if (Array.isArray(data.error)) {
        const errorMessages = data.error.map((err: any) => err.message || err.msg || err).join(', ');
        throw new Error(errorMessages || data.message || 'Login failed');
      } else if (typeof data.error === 'object' && data.error.message) {
        throw new Error(data.error.message || data.message || 'Login failed');
      } else {
        throw new Error(data.error || data.message || 'Login failed');
      }
    }

    throw new Error(data.message || 'Login failed');
  } catch (error: any) {
    console.error('Customer login error:', error);
    throw error;
  }
};

/**
 * Customer signup/register
 */
export const customerSignUp = async (data: SignUpRequest): Promise<SignUpResponse> => {
  try {
    const response = await apiRequest('auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    const result = await parseApiResponse(response);
    
    if (result.status === 'success') {
      return result as SignUpResponse;
    }

    throw new Error(result.message || 'Registration failed');
  } catch (error: any) {
    console.error('Customer signup error:', error);
    throw error;
  }
};

/**
 * Verify email with OTP
 */
export const verifyOTP = async (email: string, otp: string): Promise<VerifyOTPResponse> => {
  try {
    const response = await apiRequest('auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });

    const data = await parseApiResponse(response);
    
    if (data.status === 'success' && data.data) {
      // Store tokens and user data after verification
      localStorage.setItem('customerToken', data.data.accessToken);
      localStorage.setItem('customerRefreshToken', data.data.refreshToken);
      localStorage.setItem('customerUser', JSON.stringify(data.data.user));
      
      return data as VerifyOTPResponse;
    }

    throw new Error(data.message || 'OTP verification failed');
  } catch (error: any) {
    console.error('OTP verification error:', error);
    throw error;
  }
};

/**
 * Resend OTP
 */
export const resendOTP = async (email: string): Promise<{ status: string; message?: string }> => {
  try {
    const response = await apiRequest('auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    return await parseApiResponse(response);
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    throw error;
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
          'Authorization': `Bearer ${token}`
        }
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear local storage regardless of API call success
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerRefreshToken');
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
    
    if (data.status === 'success' && data.data?.user) {
      // Update stored user data
      localStorage.setItem('customerUser', JSON.stringify(data.data.user));
      return data.data.user;
    }

    throw new Error('Failed to fetch profile');
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
    const refreshToken = localStorage.getItem('customerRefreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    const response = await apiRequest('auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
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
    localStorage.removeItem('customerRefreshToken');
    localStorage.removeItem('customerUser');
    throw error;
  }
};
