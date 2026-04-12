import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { getApiUrl, parseApiResponse, ApiResponse } from '../config/api';
import { logger } from '../utils/logger';

interface User {
  email: string;
  name: string;
  role: string;
  phone?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const email = localStorage.getItem('adminEmail');
    const name = localStorage.getItem('adminName');
    const role = localStorage.getItem('adminRole');

    if (token && email && name) {
      logger.debug('Admin auth restored from local storage');
      setUser({ email, name, role: role || 'admin' });
    }
    
    setIsLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(getApiUrl('auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: ApiResponse = await parseApiResponse(response);

      if (response.ok && data.status === 'success') {
        // Check if user is admin
        if (data.data.user.role !== 'admin') {
          return {
            success: false,
            message: 'Access denied. Admin privileges required.',
          };
        }

        // Store auth token and user info
        const token = data.data.tokens.accessToken;
        const userEmail = data.data.user.email?.address || data.data.user.email;
        const userName = `${data.data.user.name.first} ${data.data.user.name.last}`;
        const userRole = data.data.user.role;

        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminEmail', userEmail);
        localStorage.setItem('adminName', userName);
        localStorage.setItem('adminRole', userRole);

        setUser({
          email: userEmail,
          name: userName,
          role: userRole,
        });

        return { success: true };
      } else {
        return {
          success: false,
          message: data.message || 'Invalid email or password',
        };
      }
    } catch (error) {
      logger.error('Admin login failed');
      
      // Fallback to demo login if backend is not available
      if (email === 'admin@thetiptop.com' && password === 'admin123') {
        localStorage.setItem('adminToken', 'demo-token');
        localStorage.setItem('adminEmail', email);
        localStorage.setItem('adminName', 'Demo Admin');
        localStorage.setItem('adminRole', 'admin');
        
        setUser({
          email,
          name: 'Demo Admin',
          role: 'admin',
        });

        return { success: true };
      }

      return {
        success: false,
        message: 'Cannot connect to server. Please check your connection or use demo credentials.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminRole');
    setUser(null);
    navigate('/signin');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
