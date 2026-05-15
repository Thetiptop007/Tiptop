import {
  broadcastAuthStateChange,
  clearAllAuthState,
  getAccessToken,
  getAuthUser,
  getCsrfToken,
  setAccessToken,
  setAuthUser,
  setSessionId,
  setCsrfToken,
} from './auth-session.store';
import { clearAuthScope } from './auth-scope';
import { logger } from '../utils/logger';

export interface CustomerUser {
  _id: string;
  email: string | {
    address: string;
    isVerified: boolean;
  };
  phone: string | {
    number: string;
    isVerified: boolean;
  };
  name: string | {
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

export interface SignUpRequest {
  name: string;
  phone: string;
  email: string;
  password: string;
  role?: 'customer';
}

export type CustomerAuthStatus = 'unauthenticated' | 'hydrating' | 'refreshing' | 'authenticated' | 'recovering';

export interface CustomerAuthSnapshot {
  customer: CustomerUser | null;
  status: CustomerAuthStatus;
  isLoading: boolean;
  bootstrapAttempted?: boolean;
}

export type CustomerRefreshOutcome =
  | { status: 'success'; accessToken: string; customer: CustomerUser | null }
  | { status: 'terminal'; message: string }
  | { status: 'transient'; message: string };

export type CustomerHydrationOutcome =
  | { status: 'success'; customer: CustomerUser }
  | { status: 'terminal'; message: string }
  | { status: 'transient'; message: string };

type CustomerAuthEvent = 'login' | 'logout' | 'refresh' | 'invalidate';
type SnapshotListener = () => void;

export enum CustomerLogoutReason {
  ManualLogout = 'manual_logout',
  TokenExpired = 'token_expired',
  SessionInvalidated = 'session_invalidated',
  RefreshFailed = 'refresh_failed',
  ProfileLoadFailed = 'profile_load_failed',
}

const CUSTOMER_API_BASE = (() => {
  const configuredBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const trimmed = configuredBaseUrl.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
})();

const CUSTOMER_REFRESH_URL = `${CUSTOMER_API_BASE}/auth/customer/refresh`;
const CUSTOMER_PROFILE_URL = `${CUSTOMER_API_BASE}/auth/customer/me`;

const listeners = new Set<SnapshotListener>();

let snapshot: CustomerAuthSnapshot = {
  customer: (getAuthUser('customer') as CustomerUser | null) || null,
  status: getAccessToken('customer') || getAuthUser('customer') ? 'authenticated' : 'unauthenticated',
  isLoading: false,
  bootstrapAttempted: false,
};

let refreshPromise: Promise<CustomerRefreshOutcome> | null = null;
let hydrationPromise: Promise<CustomerHydrationOutcome> | null = null;
let profilePromise: Promise<CustomerHydrationOutcome> | null = null;

let refreshRevision = 0;
let hydrationRevision = 0;
let profileRevision = 0;
let lastLogoutReason: CustomerLogoutReason | null = null;
let lastLogoutTime = 0;
const LOGOUT_DEDUPE_WINDOW_MS = 100; // Dedupe logouts within 100ms

const emit = () => {
  listeners.forEach((listener) => listener());
};

const updateSnapshot = (next: Partial<CustomerAuthSnapshot>) => {
  snapshot = {
    ...snapshot,
    ...next,
  };
  emit();
};

const getCustomerCsrfToken = (): string | null => getCsrfToken('customer');

const normalizeApiResponse = async (response: Response): Promise<any> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const isTerminalAuthResponse = (response: Response, data: any): boolean => {
  if (response.status === 401 || response.status === 403) {
    return true;
  }

  const code = data?.code ?? data?.statusCode ?? null;
  
  // Check for mixed sessions error (backend detected violation)
  if (code === 'MIXED_SESSIONS' || code === 'SCOPE_VIOLATION') {
    return true;
  }
  
  return code === 401 || code === 403;
};

const isTransientError = (error: any): boolean => {
  return error?.name === 'AbortError' || error?.name === 'TimeoutError' || !navigator.onLine;
};

const extractCustomer = (data: any): CustomerUser | null => data?.data?.user || null;

const extractTokens = (data: any): { accessToken?: string; csrfToken?: string; sessionId?: string } => ({
  accessToken: data?.data?.tokens?.accessToken,
  csrfToken: data?.data?.csrfToken || data?.data?.tokens?.csrfToken,
  sessionId: data?.data?.sessionId || data?.data?.tokens?.sessionId,
});

const setSessionState = (customer: CustomerUser | null, status: CustomerAuthStatus, tokens?: { accessToken?: string; csrfToken?: string; sessionId?: string }) => {
  if (tokens?.accessToken) {
    setAccessToken('customer', tokens.accessToken);
  }

  if (tokens?.csrfToken) {
    setCsrfToken('customer', tokens.csrfToken);
  }

  if (tokens?.sessionId) {
    setSessionId('customer', tokens.sessionId);
  }

  if (customer) {
    setAuthUser('customer', customer);
  }

  updateSnapshot({
    customer,
    status,
    isLoading: status === 'hydrating' || status === 'refreshing' || status === 'recovering',
  });
};

const clearCustomerState = (event: CustomerAuthEvent, broadcast = false) => {
  clearAllAuthState('customer');
  
  // CRITICAL: Clear auth scope when logging out
  if (event === 'logout') {
    clearAuthScope();
  }
  
  updateSnapshot({ customer: null, status: 'unauthenticated', isLoading: false });

  if (broadcast) {
    broadcastAuthStateChange('customer', event);
  }
};

const performRefresh = async (): Promise<CustomerRefreshOutcome> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  const currentRevision = ++refreshRevision;
  setSessionState(snapshot.customer, 'refreshing');

  refreshPromise = (async () => {
    try {
      const csrfToken = getCustomerCsrfToken();

      if (!csrfToken) {
        return { status: 'terminal', message: 'Missing CSRF token' } as const;
      }

      const response = await fetch(CUSTOMER_REFRESH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(5000),
      });

      const data = await normalizeApiResponse(response);
      
      // Check for mixed sessions detected by backend
      const code = data?.code ?? data?.statusCode ?? null;
      if (code && (code === 'MIXED_SESSIONS' || code === 'SCOPE_VIOLATION')) {
        // Force logout to clean state when backend detects mixed session
        try {
          const { forceLogout } = await import('./auth-scope');
          await forceLogout('backend_mixed_session_refresh');
        } catch (error) {
          logger.error('Error calling force logout for mixed session', {
            error: error instanceof Error ? error.message : String(error),
          });
          performCustomerLogout(CustomerLogoutReason.SessionInvalidated);
        }
        
        return { status: 'terminal', message: data?.message || 'Mixed session detected. Please log in again.' } as const;
      }
      
      if (isTerminalAuthResponse(response, data)) {
        return { status: 'terminal', message: data?.message || 'Customer session is no longer valid' } as const;
      }

      if (!response.ok) {
        return { status: 'transient', message: data?.message || 'Customer refresh failed' } as const;
      }

      const tokens = extractTokens(data);
      if (!tokens.accessToken) {
        return { status: 'terminal', message: data?.message || 'Refresh response did not include an access token' } as const;
      }

      const customer = extractCustomer(data);
      if (currentRevision === refreshRevision) {
        setSessionState(customer, 'authenticated', tokens);
      }

      return { status: 'success', accessToken: tokens.accessToken, customer } as const;
    } catch (error: any) {
      if (isTransientError(error)) {
        return { status: 'transient', message: error?.message || 'Customer refresh temporarily failed' } as const;
      }

      return { status: 'terminal', message: error?.message || 'Customer refresh failed' } as const;
    } finally {
      if (refreshRevision === currentRevision) {
        refreshPromise = null;
        updateSnapshot({
          status: snapshot.customer ? 'authenticated' : 'unauthenticated',
          isLoading: false,
        });
      }
    }
  })();

  return refreshPromise;
};

const loadProfile = async (): Promise<CustomerHydrationOutcome> => {
  if (profilePromise) {
   return profilePromise;
  }

  const currentRevision = ++profileRevision;
  updateSnapshot({
    status: snapshot.customer ? 'authenticated' : 'hydrating',
    isLoading: true,
  });

  profilePromise = (async () => {
    try {
      if (refreshPromise) {
        const refreshOutcome = await refreshPromise;
        if (refreshOutcome.status === 'terminal') {
          return refreshOutcome;
        }
      }

      const requestProfile = async () => {
        const accessToken = getAccessToken('customer');
        if (!accessToken) {
          return {
            response: null,
            data: null,
            message: 'Missing customer access token',
          };
        }

        const response = await fetch(CUSTOMER_PROFILE_URL, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
          credentials: 'include',
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        });

        const data = await normalizeApiResponse(response);
        return { response, data, message: null };
      };

      let profileAttempt = await requestProfile();
      if (!profileAttempt.response) {
        return { status: 'terminal', message: profileAttempt.message || 'Missing customer access token' } as const;
      }

      let response = profileAttempt.response;
      let data = profileAttempt.data;
      
      // Check for mixed sessions detected by backend
      const code = data?.code ?? data?.statusCode ?? null;
      if (code === 'MIXED_SESSIONS' || code === 'SCOPE_VIOLATION') {
        // Force logout to clean state when backend detects mixed session
        try {
          const { forceLogout } = await import('./auth-scope');
          await forceLogout('backend_mixed_session_profile');
        } catch (error) {
          logger.error('Error calling force logout for mixed session', {
            error: error instanceof Error ? error.message : String(error),
          });
          performCustomerLogout(CustomerLogoutReason.SessionInvalidated);
        }
        
        return { status: 'terminal', message: data?.message || 'Mixed session detected. Please log in again.' } as const;
      }
      
      if (isTerminalAuthResponse(response, data)) {
       if (response.status === 401) {
         const refreshOutcome = await performRefresh();
         if (refreshOutcome.status === 'success') {
           profileAttempt = await requestProfile();
           if (profileAttempt.response) {
             response = profileAttempt.response;
             data = profileAttempt.data;
           }
         }
       }

       if (isTerminalAuthResponse(response, data)) {
        performCustomerLogout(CustomerLogoutReason.ProfileLoadFailed);
        return { status: 'terminal', message: data?.message || 'Customer session expired' } as const;
       }
      }

      if (!response.ok) {
        return { status: 'transient', message: data?.message || 'Failed to load customer profile' } as const;
      }

      const customer = extractCustomer(data);
      if (!customer) {
        return { status: 'terminal', message: data?.message || 'Customer profile missing from response' } as const;
      }

      if (currentRevision === profileRevision) {
        setSessionState(customer, 'authenticated');
      }

      return { status: 'success', customer } as const;
    } catch (error: any) {
      if (isTransientError(error)) {
        return { status: 'transient', message: error?.message || 'Customer profile lookup temporarily failed' } as const;
      }

      return { status: 'terminal', message: error?.message || 'Failed to load customer profile' } as const;
    } finally {
      if (profileRevision === currentRevision) {
        profilePromise = null;
        updateSnapshot({
          status: snapshot.customer ? 'authenticated' : 'unauthenticated',
          isLoading: false,
        });
      }
    }
  })();

  return profilePromise;
};

const performCustomerLogout = (reason: CustomerLogoutReason): void => {
  const now = Date.now();
  
  // Dedupe logouts within the window to prevent duplicate broadcasts and redirects
  if (lastLogoutReason === reason && (now - lastLogoutTime) < LOGOUT_DEDUPE_WINDOW_MS) {
    return;
  }

  lastLogoutReason = reason;
  lastLogoutTime = now;

  // Clear coordinator state
  refreshPromise = null;
  hydrationPromise = null;
  profilePromise = null;

  // Clear session state and broadcast once
  clearCustomerState('logout', true);
};

export const subscribeCustomerAuth = (listener: SnapshotListener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getCustomerAuthSnapshot = (): CustomerAuthSnapshot => snapshot;

export const bootstrapCustomerAuth = async (pathname: string): Promise<CustomerHydrationOutcome | CustomerRefreshOutcome> => {
  if (hydrationPromise) {
    return hydrationPromise;
  }

  const currentRevision = ++hydrationRevision;
  logger.debug('Customer auth bootstrap initiated', { pathname });
  updateSnapshot({ status: 'hydrating', isLoading: true });

  hydrationPromise = (async () => {
    const hasAccessToken = !!getAccessToken('customer');
    let refreshOutcome: CustomerRefreshOutcome | null = null;

    if (!hasAccessToken) {
      refreshOutcome = await performRefresh();
      
      if (refreshOutcome.status === 'terminal') {
        performCustomerLogout(CustomerLogoutReason.RefreshFailed);
        return { status: 'terminal', message: refreshOutcome.message } as const;
      }
    }

    if (refreshOutcome?.status === 'transient') {
      if (currentRevision === hydrationRevision) {
        updateSnapshot({
          status: snapshot.customer ? 'authenticated' : 'recovering',
          isLoading: !snapshot.customer,
        });
      }

      return { status: 'transient', message: refreshOutcome.message } as const;
    }

    const profileOutcome = await loadProfile();
    if (profileOutcome.status === 'success') {
      return profileOutcome;
    }

    if (profileOutcome.status === 'terminal') {
       performCustomerLogout(CustomerLogoutReason.SessionInvalidated);
      return profileOutcome;
    }

    if (currentRevision === hydrationRevision) {
      updateSnapshot({
        status: snapshot.customer ? 'authenticated' : 'recovering',
        isLoading: !snapshot.customer,
      });
    }

    return profileOutcome;
  })().finally(() => {
    if (hydrationRevision === currentRevision) {
      hydrationPromise = null;
      updateSnapshot({
        status: snapshot.customer ? 'authenticated' : snapshot.status === 'recovering' ? 'recovering' : 'unauthenticated',
        isLoading: snapshot.customer ? false : snapshot.status === 'recovering',
        bootstrapAttempted: true,
      });
    }
  });

  return hydrationPromise;
};

export const refreshCustomerSession = async (): Promise<CustomerRefreshOutcome> => performRefresh();

export const refreshCustomerProfile = async (): Promise<CustomerHydrationOutcome> => loadProfile();

export const clearCustomerSession = (event: CustomerAuthEvent = 'logout', broadcast = false) => {
  clearCustomerState(event, broadcast);
};

export const performCustomerLogoutWithReason = (reason: CustomerLogoutReason): void => {
  performCustomerLogout(reason);
};

export const markCustomerAuthenticated = (customer: CustomerUser, tokens?: { accessToken?: string; csrfToken?: string }) => {
  setSessionState(customer, 'authenticated', tokens);
};

export const resetCustomerAuthForLogin = () => {
  clearAllAuthState('customer');
  updateSnapshot({ customer: null, status: 'unauthenticated', isLoading: false });
};

export const isCustomerAuthenticated = (): boolean => !!getAccessToken('customer') && !!getAuthUser('customer');

export const isCustomerAuthBootComplete = (): boolean => snapshot.bootstrapAttempted === true;

export const waitForCustomerAuthBoot = (): Promise<boolean> => {
  if (snapshot.bootstrapAttempted) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const unsubscribe = subscribeCustomerAuth(() => {
      if (snapshot.bootstrapAttempted) {
        unsubscribe();
        resolve(true);
      }
    });
  });
};
