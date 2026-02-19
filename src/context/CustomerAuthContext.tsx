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

  // Check if customer is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔐 CustomerAuth: Checking authentication');
      console.log('🔐 CustomerAuth: localStorage state:', {
        hasCustomerToken: !!localStorage.getItem('customerToken'),
        hasCustomerRefreshToken: !!localStorage.getItem('customerRefreshToken'),
        hasCustomerUser: !!localStorage.getItem('customerUser'),
        tokenPreview: localStorage.getItem('customerToken')?.substring(0, 20)
      });
      
      if (isCustomerAuthenticated()) {
        const storedCustomer = getStoredCustomer();
        if (storedCustomer) {
          console.log('✅ CustomerAuth: Customer authenticated', storedCustomer.email.address);
          setCustomer(storedCustomer);
          
          // Try to refresh profile data (but don't fail if it doesn't work)
          try {
            const updatedProfile = await getCustomerProfile();
            setCustomer(updatedProfile);
            console.log('✅ CustomerAuth: Profile refreshed successfully');
          } catch (error: any) {
            console.warn('⚠️  CustomerAuth: Could not refresh profile, keeping cached data', error);
            // Keep using the stored customer data - don't logout automatically
            // The user will be logged out when they try to make an authenticated request
          }
        }
      } else {
        console.log('❌ CustomerAuth: No customer authenticated');
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (phone: string, password: string) => {
    try {
      console.log('🔐 CustomerAuth: Attempting login for phone:', phone);
      
      const response = await customerLogin(phone, password);
      
      console.log('📦 CustomerAuth: Login response:', response);
      console.log('📦 CustomerAuth: response.data:', response.data);
      console.log('📦 CustomerAuth: response.data.user:', response.data?.user);
      
      if (response.status === 'success' && response.data.user) {
        console.log('✅ CustomerAuth: Login successful');
        console.log('✅ CustomerAuth: Setting customer state with:', response.data.user);
        setCustomer(response.data.user);
        return { success: true, message: 'Login successful' };
      }
      
      return { success: false, message: 'Login failed' };
    } catch (error: any) {
      console.error('❌ CustomerAuth: Login failed', error);
      
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
      console.log('📝 CustomerAuth: Attempting signup for email:', data.email);
      
      const response = await customerSignUp(data);
      
      if (response.status === 'success' && response.data) {
        console.log('✅ CustomerAuth: Signup successful, user auto-logged in');
        
        // User is auto-logged in, set the customer state
        setCustomer(response.data.user);
        
        return {
          success: true,
          user: response.data.user,
          autoLogin: true,
          message: response.message || 'Registration successful! You are now logged in.'
        };
      }
      
      return { success: false, message: 'Registration failed' };
    } catch (error: any) {
      console.error('❌ CustomerAuth: Signup failed', error);
      return {
        success: false,
        message: error.message || 'Registration failed. Please try again.'
      };
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      console.log('🔐 CustomerAuth: Verifying OTP for email:', email);
      
      const response = await verifyOTPService(email, otp);
      
      if (response.status === 'success' && response.data.user) {
        console.log('✅ CustomerAuth: OTP verification successful');
        setCustomer(response.data.user);
        return { success: true, message: 'Email verified successfully!' };
      }
      
      return { success: false, message: 'Verification failed' };
    } catch (error: any) {
      console.error('❌ CustomerAuth: OTP verification failed', error);
      return {
        success: false,
        message: error.message || 'Invalid OTP. Please try again.'
      };
    }
  };

  const resendOTP = async (email: string) => {
    try {
      console.log('📧 CustomerAuth: Resending OTP to:', email);
      
      const response = await resendOTPService(email);
      
      if (response.status === 'success') {
        console.log('✅ CustomerAuth: OTP resent successfully');
        return { success: true, message: 'OTP sent successfully!' };
      }
      
      return { success: false, message: 'Failed to resend OTP' };
    } catch (error: any) {
      console.error('❌ CustomerAuth: Resend OTP failed', error);
      return {
        success: false,
        message: error.message || 'Failed to resend OTP. Please try again.'
      };
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 CustomerAuth: Logging out');
      await customerLogout();
      setCustomer(null);
      navigate('/');
      console.log('✅ CustomerAuth: Logout successful');
    } catch (error) {
      console.error('❌ CustomerAuth: Logout error', error);
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
      console.error('Failed to refresh profile:', error);
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
