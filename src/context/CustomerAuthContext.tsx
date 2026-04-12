import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router';
import {
  customerLogin,
  customerSignUp,
  customerLogout,
  verifyOTP as verifyOTPService,
  resendOTP as resendOTPService,
  getCustomerProfile,
  isCustomerAuthenticated,
  getStoredCustomer,
  CustomerUser,
  LoginRequest,
  SignUpRequest,
} from '../services/customer-auth.service';
import { requestFcmToken } from '../config/firebase';
import { apiRequest } from '../config/api';
import { logger } from '../utils/logger';

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; message?: string; needsVerification?: boolean; email?: string }>;
  signUp: (data: SignUpRequest) => Promise<{ success: boolean; message?: string; user?: CustomerUser; autoLogin?: boolean }>;
  logout: () => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  resendOTP: (email: string) => Promise<{ success: boolean; message?: string }>;
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

  // Helper function to register FCM token
  const registerFcmToken = async () => {
    try {
      logger.debug('Requesting FCM token');
      const fcmToken = await requestFcmToken();
      
      if (fcmToken) {
        logger.debug('FCM token received');
        
        // Send token to backend
        const authToken = localStorage.getItem('customerToken');
        if (authToken) {
          await apiRequest('/auth/device-token', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              token: fcmToken, 
              platform: 'web' 
            }),
          });
          logger.debug('FCM token registered with backend');
        }
      } else {
        logger.warn('FCM token request denied or unsupported');
      }
    } catch (error) {
      logger.error('Failed to register FCM token');
      // Don't block login if FCM fails
    }
  };

  // Check if customer is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      logger.debug('Checking customer authentication');
      
      if (isCustomerAuthenticated()) {
        const storedCustomer = getStoredCustomer();
        if (storedCustomer) {
          logger.debug('Customer authenticated from storage');
          setCustomer(storedCustomer);
          
          // Try to refresh profile data (but don't fail if it doesn't work)
          try {
            const updatedProfile = await getCustomerProfile();
            setCustomer(updatedProfile);
            logger.debug('Customer profile refreshed');
          } catch (error: any) {
            logger.warn('Could not refresh customer profile, using cached data');
            // Keep using the stored customer data - don't logout automatically
            // The user will be logged out when they try to make an authenticated request
          }
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (phone: string, password: string) => {
    try {
      logger.debug('Customer login attempt started');
      
      const response = await customerLogin(phone, password);
      
      if (response.status === 'success' && response.data.user) {
        logger.info('Customer login successful');
        setCustomer(response.data.user);
        
        // Register FCM token for web notifications (non-blocking)
        registerFcmToken().catch(() => logger.warn('FCM registration failed after login'));
        
        return { success: true, message: 'Login successful' };
      }
      
      return { success: false, message: 'Login failed' };
    } catch (error: any) {
      logger.error('Customer login failed');
      
      // Check if email verification is needed
      if (error.needsVerification) {
        return {
          success: false,
          needsVerification: true,
          email: error.email,
          message: 'Please verify your email address'
        };
      }
      
      return {
        success: false,
        message: error.message || 'Login failed. Please check your credentials.'
      };
    }
  };

  const signUp = async (data: SignUpRequest) => {
    try {
      logger.debug('Customer signup attempt started');
      
      const response = await customerSignUp(data);
      
      if (response.status === 'success' && response.data) {
        logger.info('Customer signup successful');
        
        // User is auto-logged in, set the customer state
        setCustomer(response.data.user);
        
        // Register FCM token for web notifications (non-blocking)
        registerFcmToken().catch(() => logger.warn('FCM registration failed after signup'));
        
        return {
          success: true,
          user: response.data.user,
          autoLogin: true,
          message: response.message || 'Registration successful! You are now logged in.'
        };
      }
      
      return { success: false, message: 'Registration failed' };
    } catch (error: any) {
      logger.error('Customer signup failed');
      return {
        success: false,
        message: error.message || 'Registration failed. Please try again.'
      };
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      logger.debug('Customer OTP verification started');
      
      const response = await verifyOTPService(email, otp);
      
      if (response.status === 'success' && response.data.user) {
        logger.info('Customer OTP verification successful');
        setCustomer(response.data.user);
        return { success: true, message: 'Email verified successfully!' };
      }
      
      return { success: false, message: 'Verification failed' };
    } catch (error: any) {
      logger.error('Customer OTP verification failed');
      return {
        success: false,
        message: error.message || 'Invalid OTP. Please try again.'
      };
    }
  };

  const resendOTP = async (email: string) => {
    try {
      logger.debug('Customer OTP resend started');
      
      const response = await resendOTPService(email);
      
      if (response.status === 'success') {
        logger.info('Customer OTP resent successfully');
        return { success: true, message: 'OTP sent successfully!' };
      }
      
      return { success: false, message: 'Failed to resend OTP' };
    } catch (error: any) {
      logger.error('Customer OTP resend failed');
      return {
        success: false,
        message: error.message || 'Failed to resend OTP. Please try again.'
      };
    }
  };

  const logout = async () => {
    try {
      logger.debug('Customer logout started');
      await customerLogout();
      setCustomer(null);
      navigate('/');
      logger.info('Customer logout successful');
    } catch (error) {
      logger.error('Customer logout failed');
      // Clear state anyway
      setCustomer(null);
      navigate('/');
    }
  };

  const refreshProfile = async () => {
    try {
      const updatedProfile = await getCustomerProfile();
      setCustomer(updatedProfile);
    } catch (error) {
      logger.error('Failed to refresh customer profile');
    }
  };

  const value: CustomerAuthContextType = {
    customer,
    isAuthenticated: !!customer && !!localStorage.getItem('customerToken'),
    isLoading,
    login,
    signUp,
    logout,
    verifyOTP,
    resendOTP,
    refreshProfile,
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
};
