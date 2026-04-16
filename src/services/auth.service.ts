import { apiRequest, parseApiResponse } from '../config/api';

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
  const response = await apiRequest('auth/me');
  const data = await parseApiResponse(response);

  if (response.status === 401) {
    throw new Error(data.message || 'Invalid token. Please log in again.');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch current user.');
  }

  if (data.status === 'success' && data.data?.user) {
    return data.data.user;
  }

  return null;
};

/**
 * Update current authenticated user's profile
 */
export const updateCurrentUser = async (profileData: UpdateProfileData): Promise<User | null> => {
  try {
    console.log('🔄 [updateCurrentUser] Sending profile update:', profileData);
    const response = await apiRequest('auth/me', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
    console.log('✅ [updateCurrentUser] Update response:', response);
    const data = await parseApiResponse(response);

    if (data.status === 'success' && data.data?.user) {
      return data.data.user;
    }

    return null;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Change password for current authenticated user
 */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
  try {
    const response = await apiRequest('auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });
    const data = await parseApiResponse(response);

    return data.status === 'success';
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};
