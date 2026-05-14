import { apiRequest, parseApiResponse } from '../config/api';
import { logger } from '../utils/logger';

export interface AuthSession {
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  issuedAt: string;
  lastUsedAt: string;
  isCurrent: boolean;
}

/**
 * Get active sessions for the current authenticated user
 * @param role 'admin' or 'customer'
 */
export const getActiveSessions = async (role: 'admin' | 'customer'): Promise<AuthSession[]> => {
  try {
    const response = await apiRequest(`auth/${role}/sessions`);
    const data = await parseApiResponse(response);
    
    if (data.status === 'success' && data.data?.sessions) {
      return data.data.sessions;
    }
    
    return [];
  } catch (error) {
    logger.error('Error fetching active sessions', { 
      role, 
      errorMessage: error instanceof Error ? error.message : String(error) 
    });
    return [];
  }
};

/**
 * Request an OTP for session revocation
 * @param role 'admin' or 'customer'
 */
export const requestRevocationOtp = async (role: 'admin' | 'customer'): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await apiRequest(`auth/${role}/sessions/revoke-otp`, {
      method: 'POST',
    });
    const data = await parseApiResponse(response);
    
    return {
      success: data.status === 'success',
      message: data.message,
    };
  } catch (error) {
    logger.error('Error requesting revocation OTP', { 
      role, 
      errorMessage: error instanceof Error ? error.message : String(error) 
    });
    return { success: false, message: 'Failed to request OTP' };
  }
};

/**
 * Revoke a specific session
 * @param role 'admin' or 'customer'
 * @param sessionId The ID of the session to revoke
 * @param otp The verification OTP
 */
export const revokeSession = async (role: 'admin' | 'customer', sessionId: string, otp: string): Promise<boolean> => {
  try {
    const response = await apiRequest(`auth/${role}/sessions/${sessionId}`, {
      method: 'DELETE',
      body: JSON.stringify({ otp }),
    });
    const data = await parseApiResponse(response);
    
    return data.status === 'success';
  } catch (error) {
    logger.error('Error revoking session', { 
      role, 
      sessionId, 
      errorMessage: error instanceof Error ? error.message : String(error) 
    });
    return false;
  }
};

/**
 * Revoke all other sessions except the current one
 * @param role 'admin' or 'customer'
 * @param otp The verification OTP
 */
export const revokeAllOtherSessions = async (role: 'admin' | 'customer', otp: string): Promise<boolean> => {
  try {
    const response = await apiRequest(`auth/${role}/sessions/other`, {
      method: 'DELETE',
      body: JSON.stringify({ otp }),
    });
    const data = await parseApiResponse(response);
    
    return data.status === 'success';
  } catch (error) {
    logger.error('Error revoking all other sessions', { 
      role, 
      errorMessage: error instanceof Error ? error.message : String(error) 
    });
    return false;
  }
};
