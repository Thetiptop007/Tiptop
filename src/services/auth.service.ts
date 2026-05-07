import { apiRequest, parseApiResponse } from '../config/api';
import { authStore } from './auth.store';
import { setCsrfToken } from './auth-session.store';
import { logger } from '../utils/logger';

export interface User {
  _id: string;
  name: {
    first: string;
    last: string;
  };
  email: {
    address: string;
    isVerified: boolean;
  };
  phone?: {
    number: string;
    isVerified: boolean;
  };
  role: 'customer' | 'admin' | 'delivery';
  addresses?: Array<any>;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  name?: {
    first: string;
    last: string;
  };
  email?: string;
  phone?: string;
  preferences?: any;
  addresses?: any[];
}

/**
 * Get current authenticated user's profile
 */
export const getCurrentUser = async (): Promise<User | null> => {
  // Auth is handled by coordinators, just return current state
  const currentUser = authStore.getState().user as User | null;

  if (!currentUser) {
    return null;
  }

  return currentUser;
};

/**
 * Update current authenticated user's profile
 */
export const updateCurrentUser = async (profileData: UpdateProfileData): Promise<User | null> => {
  try {
    logger.auth('PROFILE_UPDATE_REQUESTED', 'Updating admin profile', {
      hasName: !!profileData.name,
      hasEmail: !!profileData.email,
      hasPhone: !!profileData.phone,
    });
    const response = await apiRequest('auth/admin/me', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
    const data = await parseApiResponse(response);

    if (data.status === 'success' && data.data?.user) {
      const csrfToken = data.data?.csrfToken || data.data?.tokens?.csrfToken;
      if (csrfToken) {
        setCsrfToken('admin', csrfToken);
      }
      logger.auth('PROFILE_UPDATE_SUCCESS', 'Admin profile updated successfully', { hasCsrfToken: !!csrfToken });
      return data.data.user;
    }

    return null;
  } catch (error) {
    logger.error('Error updating user profile', { errorMessage: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

/**
 * Change password for current authenticated user
 */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
  try {
    const response = await apiRequest('auth/admin/change-password', {
      method: 'PATCH',
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });
    const data = await parseApiResponse(response);

    const csrfToken = data.data?.csrfToken || data.data?.tokens?.csrfToken;
    if (csrfToken) {
      setCsrfToken('admin', csrfToken);
    }

    return data.status === 'success';
  } catch (error) {
    logger.error('Error changing password', { errorMessage: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};
