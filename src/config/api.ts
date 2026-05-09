/**
 * Get the API base URL from environment variables
 * Falls back to localhost if not set
 */
import { logger } from '../utils/logger';
import {
  clearAllAuthState,
  broadcastAuthStateChange,
  getCsrfToken,
  getAccessToken,
  setSessionId,
  getAuthUser,
  getRequestAuthScope,
  setAccessToken,
  setCsrfToken,
} from '../services/auth-session.store';
import {
  clearCustomerSession as clearCustomerAuthSession,
  refreshCustomerSession,
  CustomerLogoutReason,
  performCustomerLogoutWithReason,
} from '../services/customer-auth.coordinator';

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
  inFlightGetRequests.clear();
  recentGetResponses.clear();
  clearAllAuthState('admin');
};

export const clearAdminAuthStorage = clearAdminSession;

const clearAndBroadcastSession = (scope: 'admin' | 'customer' | null, event: 'logout' | 'invalidate') => {
  if (scope === 'admin') {
    clearAdminSession();
    broadcastAuthStateChange('admin', event);
  } else if (scope === 'customer') {
    clearCustomerAuthSession(event, false);
    broadcastAuthStateChange('customer', event);
  } else {
    clearAllAuthStorage();
  }
};

export const clearCustomerAuthStorage = () => clearCustomerAuthSession('invalidate', false);

export const clearAllAuthStorage = () => {
  clearAdminSession();
  clearCustomerAuthSession('invalidate', false);
  clearAllAuthState();
};

const readCookie = (name: string): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

export const getCsrfTokenForScope = (scope: 'admin' | 'customer' | null): string | null => {
  if (!scope) {
    return null;
  }

  return getCsrfToken(scope) || readCookie(`${scope}CsrfToken`);
};

const extractCsrfToken = (data: any): string | null => {
  return data?.data?.csrfToken || data?.data?.tokens?.csrfToken || null;
};

const extractSessionId = (data: any): string | null => {
  return data?.data?.sessionId || data?.data?.tokens?.sessionId || null;
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

const extractErrorContext = (error: any, endpoint: string, response?: Response, timeoutMs?: number) => {
  const context: any = {
    endpoint,
    name: error?.name,
    message: error?.message,
    statusCode: response?.status,
    timeoutMs,
  };

  if (response) {
    context.httpStatus = response.status;
    context.statusText = response.statusText;
  }

  if (error?.name === 'TimeoutError') {
    context.errorType = 'TIMEOUT';
    context.hint = timeoutMs
      ? `Backend service is slower than the configured ${timeoutMs}ms timeout`
      : 'Backend service is slow or unreachable';
  } else if (error?.name === 'AbortError') {
    context.errorType = 'ABORTED';
    context.hint = 'Request was cancelled or signal timed out';
  } else if (response?.status === 401) {
    context.errorType = 'UNAUTHORIZED';
    context.hint = 'Access token expired or invalid';
  } else if (response?.status === 403) {
    context.errorType = 'FORBIDDEN';
    context.hint = 'User does not have permission';
  } else if (!navigator.onLine) {
    context.errorType = 'OFFLINE';
    context.hint = 'No internet connection';
  } else {
    context.errorType = 'NETWORK_ERROR';
  }

  return context;
};

const shouldLogRequestLifecycle = () => false;

const shouldLogRequestCompletion = (status: number, durationMs: number) => {
  return status >= 400 || durationMs >= 5000;
};


const createRequestId = () => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {}

  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const extractUserId = (scope: 'admin' | 'customer' | null): string | null => {
  if (!scope) {
    return null;
  }

  const user = getAuthUser(scope) as any;
  if (!user) {
    return null;
  }

  return user._id || user.id || null;
};

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

  inFlightRefreshPromise = (async () => {
    try {

      const scope = window.location.pathname.startsWith('/admin') ? 'admin' : 'customer';
      const csrfToken = getCsrfTokenForScope(scope);
      const refreshRequestId = createRequestId();
      const refreshUserId = extractUserId(scope);



      if (!csrfToken) {
        logger.warn('AUTH_REFRESH_FAILED', {
          reason: 'missing_csrf_token',
          scope,
          requestId: refreshRequestId,
          userId: refreshUserId,
        });
        logger.warn('SESSION_EXPIRED', {
          reason: 'refresh_missing_csrf',
          scope,
          requestId: refreshRequestId,
          userId: refreshUserId,
        });
        return null;
      }

      const refreshEndpoint = scope === 'admin' ? 'auth/admin/refresh' : 'auth/customer/refresh';
      const response = await fetch(getApiUrl(refreshEndpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': refreshRequestId,
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({}),
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });

      if (response.status === 200) {
        const data = await response.json();
        if (data.status === 'success' && data.data?.tokens?.accessToken) {
          const newAccessToken = data.data.tokens.accessToken;
          setAccessToken(scope, newAccessToken);
          const sessionId = extractSessionId(data);
          if (sessionId) {
            setSessionId(scope, sessionId);
          }
          const csrfToken = extractCsrfToken(data);
          if (csrfToken) {
            setCsrfToken(scope, csrfToken);
          }
          logger.auth('TOKEN_REFRESH_SUCCESS', 'Token refreshed successfully', {
            scope,
            requestId: refreshRequestId,
            userId: refreshUserId,
          });

          return newAccessToken;
        }
      }

      logger.error('AUTH_REFRESH_FAILED', {
        scope,
        statusCode: response.status,
        requestId: refreshRequestId,
        userId: refreshUserId,
      });
      logger.warn('SESSION_EXPIRED', {
        reason: 'refresh_denied',
        scope,
        statusCode: response.status,
        requestId: refreshRequestId,
        userId: refreshUserId,
      });
      clearAllAuthStorage();

      return null;
    } catch (error: any) {
      logger.error('AUTH_REFRESH_FAILED', {
        errorMessage: error?.message,
        scope: window.location.pathname.startsWith('/admin') ? 'admin' : 'customer',
      });
      logger.warn('SESSION_EXPIRED', {
        reason: 'refresh_exception',
        scope: window.location.pathname.startsWith('/admin') ? 'admin' : 'customer',
      });
      clearAllAuthStorage();

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
  options: RequestInit & { timeoutMs?: number } = {},
  retryCount = 0
): Promise<Response> => {
  const fullUrl = getApiUrl(endpoint);
  const method = (options.method || 'GET').toUpperCase();
  const { timeoutMs = 10000, ...requestOptions } = options;
  
  // Check if online before making request
  if (!navigator.onLine) {
    throw new Error('No internet connection. Please check your network and try again.');
  }
  
  const finalUrl = fullUrl;
  const startedAt = performance.now();
  const requestId = createRequestId();
  
  const authScope = getRequestAuthScope(endpoint);
  const userId = extractUserId(authScope);
  const isRefreshEndpoint = endpoint.endsWith('/refresh') || endpoint === 'auth/refresh-token';

  // Auth is handled by coordinators - no need to wait
  
  // Check if Authorization header is explicitly provided in options
  const hasExplicitAuth = requestOptions.headers && 'Authorization' in requestOptions.headers;
  const token = authScope ? getAccessToken(authScope) : null;
  const csrfToken = authScope ? getCsrfTokenForScope(authScope) : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-Id': requestId,
    ...(requestOptions.headers as Record<string, string>),
  };
  if (csrfToken && method !== 'GET' && !headers['X-CSRF-Token']) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  if (shouldLogRequestLifecycle() && authScope && method !== 'GET') {

  }

  if (token && !isRefreshEndpoint && !hasExplicitAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const authHeader = headers['Authorization'] || '';
  const bearerToken = token ? `Bearer ${token}` : '';
  const isAdminAuthRequest =
    authScope === 'admin' &&
    authHeader.length > 0 &&
    authHeader === bearerToken &&
    !isRefreshEndpoint;
  const isCustomerAuthRequest =
    authScope === 'customer' &&
    authHeader.length > 0 &&
    authHeader === bearerToken &&
    !isRefreshEndpoint &&
    !isAdminAuthRequest;

  let customerRefreshOutcome: { status: 'success' | 'terminal' | 'transient' } | null = null;
  
  const executeRequest = async (): Promise<Response> => {
    const response = await fetch(finalUrl, {
      ...requestOptions,
      method,
      headers,
      credentials: 'include',
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });
    const durationMs = Math.round(performance.now() - startedAt);
    const requestSucceeded = response.status < 400;
    // Try to parse JSON body (non-blocking) to detect backend-declared auth failures
    let bodyJson: any = null;
    try {
      bodyJson = await response.clone().json();
    } catch (err) {
      bodyJson = null;
    }

    // Some backend endpoints return 200 but include a body.code indicating 401/403.
    // Treat those as authorization failures and force logout + redirect.
    const backendCode = bodyJson?.code ?? bodyJson?.statusCode ?? null;
    if ((response.status === 200 || response.status === 204) && (backendCode === 401 || backendCode === 403)) {
      logger.warn('Backend returned auth failure in body despite 200 status', { endpoint, backendCode });

      const currentPath = window.location.pathname;
      const isAdminRoute = currentPath.startsWith('/admin');
      const isCustomerRoute = currentPath.startsWith('/customer');

      if (isAdminRoute) {
        clearAndBroadcastSession('admin', 'invalidate');
        redirectToSignIn();
      } else if (isCustomerRoute) {
        performCustomerLogoutWithReason(CustomerLogoutReason.TokenExpired);
        if (window.location.pathname !== '/customer/login') {
          window.location.href = '/customer/login';
        }
      } else {
        // Generic fallback
        clearAllAuthStorage();
        redirectToSignIn();
      }
      if (shouldLogRequestCompletion(response.status, durationMs)) {
        logger.network('API_REQUEST_COMPLETE', 'API request completed', {
          endpoint,
          method,
          status: response.status,
          durationMs,
          success: false,
          authScope,
          requestId,
          userId,
          retry: retryCount > 0 ? retryCount : undefined,
        });
      }
      // Return response so callers get original shape (they'll see redirected page)
      return response;
    }
    
    // Handle 401 Unauthorized - try to refresh token and retry
    if (response.status === 401 && retryCount < 1 && (isAdminAuthRequest || isCustomerAuthRequest)) {
      logger.warn('Received 401, attempting token refresh', { endpoint });
         if (import.meta.env.DEV && isCustomerAuthRequest) {
         logger.debug('CUSTOMER_AUTH_REQUEST_401', 'Customer auth request failed with 401', { endpoint, retry: retryCount });
       }
      
      const newToken = isCustomerAuthRequest
        ? await refreshCustomerSession().then((outcome) => {
            customerRefreshOutcome = outcome;
             if (shouldLogRequestLifecycle()) {
               logger.debug('CUSTOMER_AUTH_REFRESH_OUTCOME', 'Refresh outcome received', { outcome: outcome.status });
             }
            return outcome.status === 'success' ? outcome.accessToken : null;
          })
        : await refreshAccessToken();
      
      if (newToken) {
        // Retry once with the refreshed token from the shared auth store.

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
      if (isAdminRoute && isAdminAuthRequest) {
        clearAndBroadcastSession('admin', 'invalidate');
        redirectToSignIn();
      } else if (isCustomerRoute && isCustomerAuthRequest) {
        if (customerRefreshOutcome?.status !== 'transient') {
          performCustomerLogoutWithReason(CustomerLogoutReason.TokenExpired);
          if (window.location.pathname !== '/customer/login') {
            window.location.href = '/customer/login';
          }
        }
      }
      // For customer routes, don't auto-clear tokens
      // Components/contexts will handle token clearing when appropriate
    }

    if (shouldLogRequestCompletion(response.status, durationMs)) {
      logger.network('API_REQUEST_COMPLETE', 'API request completed', {
        endpoint,
        method,
        status: response.status,
        durationMs,
        success: requestSucceeded,
        authScope,
        requestId,
        userId,
        retry: retryCount > 0 ? retryCount : undefined,
      });
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
    const errorContext = extractErrorContext(error, endpoint, undefined, timeoutMs);
    
    logger.error('API_REQUEST_FAILED', {
      endpoint,
      requestId,
      userId,
      durationMs: Math.round(performance.now() - startedAt),
      statusCode: errorContext.statusCode,
      errorType: errorContext.errorType,
      message: errorContext.message,
    });
    
    // Handle network errors with user-friendly messages
    if (error.name === 'TimeoutError') {
      logger.error('API_REQUEST_TIMEOUT', {
        endpoint,
        requestId,
        userId,
        timeoutMs,
      });
      throw new Error('Request timed out. The server is taking too long to respond. Please try again.');
    }
    if (error.name === 'AbortError') {
      logger.warn('API_REQUEST_ABORTED', {
        endpoint,
        requestId,
        userId,
      });
      throw new Error('Request was cancelled. Please try again.');
    }
    if (!navigator.onLine) {
      logger.warn('API_REQUEST_OFFLINE', {
        endpoint,
        requestId,
        userId,
      });
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
  code?: string;
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
    return await response.json();
  } catch (error) {
    logger.error('Failed to parse API response', { status: response.status });
    return {
      status: 'error',
      message: 'Failed to parse response',
      error,
    };
  }
};
