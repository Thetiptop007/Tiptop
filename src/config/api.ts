/**
 * Get the API base URL from environment variables
 * Falls back to localhost if not set
 */
import { logger } from '../utils/logger';

const normalizeApiBaseUrl = (rawBaseUrl: string): string => {
  const trimmed = rawBaseUrl.trim().replace(/\/+$/, '');

  // If the configured URL already points to /api/v1, keep it as-is.
  if (trimmed.endsWith('/api/v1')) {
    return trimmed;
  }

  // Most backend routes are mounted under /api/v1.
  return `${trimmed}/api/v1`;
};

interface ResponseSnapshot {
  body: string;
  status: number;
  statusText: string;
  headers: Array<[string, string]>;
}

const inFlightGetRequests = new Map<string, Promise<ResponseSnapshot>>();
const recentGetResponses = new Map<string, { snapshot: ResponseSnapshot; expiresAt: number }>();
const GET_RESPONSE_TTL_MS = 1500;
let inFlightRefreshPromise: Promise<string | null> | null = null;

const clearAdminSession = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminRefreshToken');
  localStorage.removeItem('adminEmail');
  localStorage.removeItem('adminName');
  localStorage.removeItem('adminRole');
  inFlightGetRequests.clear();
  recentGetResponses.clear();
};

const redirectToSignIn = () => {
  if (window.location.pathname !== '/signin') {
    window.location.href = '/signin';
  }
};

const createResponseFromSnapshot = (snapshot: ResponseSnapshot): Response =>
  new Response(snapshot.body, {
    status: snapshot.status,
    statusText: snapshot.statusText,
    headers: new Headers(snapshot.headers),
  });

const snapshotResponse = async (response: Response): Promise<ResponseSnapshot> => ({
  body: await response.text(),
  status: response.status,
  statusText: response.statusText,
  headers: Array.from(response.headers.entries()),
});

export const getApiUrl = (endpoint: string = ''): string => {
  const configuredBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const baseUrl = normalizeApiBaseUrl(configuredBaseUrl);
  
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Combine base URL and endpoint
  return cleanEndpoint ? `${baseUrl}/${cleanEndpoint}` : baseUrl;
};

/**
 * Refresh the access token using the refresh token
 * Stores new token in localStorage if successful
 */
const refreshAccessToken = async (): Promise<string | null> => {
  if (inFlightRefreshPromise) {
    return inFlightRefreshPromise;
  }

  const refreshToken = localStorage.getItem('adminRefreshToken');
  
  if (!refreshToken) {
    logger.warn('No refresh token available for token refresh');
    return null;
  }

  inFlightRefreshPromise = (async () => {
    try {
      const response = await fetch(getApiUrl('auth/refresh-token'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });

      if (response.status === 200) {
        const data = await response.json();
        if (data.status === 'success' && data.data?.accessToken) {
          const newAccessToken = data.data.accessToken;
          localStorage.setItem('adminToken', newAccessToken);
          logger.info('Token refreshed successfully');
          return newAccessToken;
        }
      }

      logger.warn('Failed to refresh token:', response.status);
      clearAdminSession();
      return null;
    } catch (error: any) {
      logger.error('Token refresh failed:', error?.message);
      clearAdminSession();
      return null;
    } finally {
      inFlightRefreshPromise = null;
    }
  })();

  return inFlightRefreshPromise;
};

/**
 * Make an authenticated API request with automatic token refresh on 401
 */
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<Response> => {
  const fullUrl = getApiUrl(endpoint);
  const method = (options.method || 'GET').toUpperCase();
  
  // Check if online before making request
  if (!navigator.onLine) {
    throw new Error('No internet connection. Please check your network and try again.');
  }
  
  const finalUrl = fullUrl;
  
  logger.debug('API request started', {
    endpoint,
    method: options.method || 'GET',
    retry: retryCount > 0 ? retryCount : undefined,
  });
  
  // Check if this is a customer authentication endpoint (should not include admin token)
  // This includes auth endpoints and customer-specific user endpoints
  const isCustomerAuthEndpoint = endpoint.match(/^auth\/(login|register|verify-otp|resend-otp)$/);
  const isCustomerAddressEndpoint = endpoint.match(/^\/addresses/);
  const isRefreshEndpoint = endpoint === 'auth/refresh-token';
  
  // Check if Authorization header is explicitly provided in options
  const hasExplicitAuth = options.headers && 'Authorization' in options.headers;
  
  const token = localStorage.getItem('adminToken');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  // Only add admin token if:
  // 1. Token exists
  // 2. NOT a customer auth endpoint (login/register/verify-otp/resend-otp)
  // 3. NOT a customer address endpoint (/addresses)
  // 4. NOT the refresh endpoint itself
  // 5. Authorization header not already explicitly set in options
  if (token && !isCustomerAuthEndpoint && !isCustomerAddressEndpoint && !isRefreshEndpoint && !hasExplicitAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const executeRequest = async (): Promise<Response> => {
    const response = await fetch(finalUrl, {
      ...options,
      method,
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000), // 10 second timeout for debugging
    });
    
    logger.debug('API response received', {
      endpoint,
      status: response.status,
    });
    
    // Handle 401 Unauthorized - try to refresh token and retry
    if (response.status === 401 && retryCount < 1 && !isRefreshEndpoint && token) {
      logger.warn('Received 401, attempting token refresh...', { endpoint });
      
      const newToken = await refreshAccessToken();
      
      if (newToken && method === 'GET') {
        // Only auto-retry GET requests (safe to retry)
        logger.info('Retrying request with refreshed token', { endpoint });
        return apiRequest(endpoint, options, retryCount + 1);
      }
    }
    
    // Handle 401 when no retry possible or refresh failed
    if (response.status === 401) {
      const currentPath = window.location.pathname;
      const isAdminRoute = currentPath.startsWith('/admin');
      const isCustomerRoute = currentPath.startsWith('/customer');
      
      logger.warn('Unauthorized API response', {
        currentPath,
        isAdminRoute,
        isCustomerRoute,
        endpoint,
        retryCount,
      });
      
      // Clear and redirect admin sessions as soon as auth is invalid.
      // This handles legacy sessions that still have access token but no refresh token.
      if (isAdminRoute) {
        clearAdminSession();
        redirectToSignIn();
      }
      // For customer routes, don't auto-clear tokens
      // Components/contexts will handle token clearing when appropriate
    }
    
    return response;
  };

  try {
    if (method === 'GET') {
      const authKey = headers['Authorization'] || '';
      const dedupeKey = `${method}:${finalUrl}:auth:${authKey}`;
      const now = Date.now();

      const cached = recentGetResponses.get(dedupeKey);
      if (cached && cached.expiresAt > now) {
        return createResponseFromSnapshot(cached.snapshot);
      }

      const inFlight = inFlightGetRequests.get(dedupeKey);
      if (inFlight) {
        const snapshot = await inFlight;
        return createResponseFromSnapshot(snapshot);
      }

      const requestPromise = executeRequest()
        .then(snapshotResponse)
        .then((snapshot) => {
          if (snapshot.status < 400) {
            recentGetResponses.set(dedupeKey, {
              snapshot,
              expiresAt: Date.now() + GET_RESPONSE_TTL_MS,
            });
          }
          return snapshot;
        })
        .finally(() => {
          inFlightGetRequests.delete(dedupeKey);
        });

      inFlightGetRequests.set(dedupeKey, requestPromise);
      const snapshot = await requestPromise;
      return createResponseFromSnapshot(snapshot);
    }

    return await executeRequest();
  } catch (error: any) {
    logger.error('API request failed', {
      endpoint,
      method,
      name: error?.name,
      message: error?.message,
    });
    
    // Handle network errors with user-friendly messages
    if (error.name === 'TimeoutError') {
      throw new Error('Request timed out. The server is taking too long to respond. Please try again.');
    }
    if (error.name === 'AbortError') {
      throw new Error('Request was cancelled. Please try again.');
    }
    if (!navigator.onLine) {
      throw new Error('Lost internet connection while processing request. Please check your network.');
    }
    // Generic network error
    throw new Error('Network error occurred. Please check your internet connection and try again.');
  }
};

/**
 * API response types
 */
export interface ApiResponse<T = any> {
  status: 'success' | 'error' | 'fail';
  message?: string;
  data?: T;
  error?: any;
  errors?: Array<{ message?: string; msg?: string; field?: string }>;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    limit: number;
  };
}

/**
 * Parse API response
 */
export const parseApiResponse = async <T = any>(
  response: Response
): Promise<ApiResponse<T>> => {
  try {
    const data = await response.json();
    logger.debug('API response parsed', { status: response.status });
    return data;
  } catch (error) {
    logger.error('Failed to parse API response', { status: response.status });
    return {
      status: 'error',
      message: 'Failed to parse response',
      error,
    };
  }
};
