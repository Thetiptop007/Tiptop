import {
  broadcastAuthStateChange,
  clearAllAuthState,
  getAccessToken,
  getAuthUser,
  getCsrfToken,
  setAccessToken,
  setAuthUser,
  setCsrfToken,
} from './auth-session.store';
import { logger } from '../utils/logger';

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

export interface SignUpRequest {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: 'customer';
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
let lastBootstrapPathname: string | null = null;

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

const readCookie = (name: string): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const getCustomerCsrfToken = (): string | null => getCsrfToken('customer') || readCookie('customerCsrfToken');

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
  return code === 401 || code === 403;
};

const isTransientError = (error: any): boolean => {
  return error?.name === 'AbortError' || error?.name === 'TimeoutError' || !navigator.onLine;
};

const extractCustomer = (data: any): CustomerUser | null => data?.data?.user || null;

const extractTokens = (data: any): { accessToken?: string; csrfToken?: string } => ({
  accessToken: data?.data?.tokens?.accessToken,
  csrfToken: data?.data?.csrfToken || data?.data?.tokens?.csrfToken,
});

const setSessionState = (customer: CustomerUser | null, status: CustomerAuthStatus, tokens?: { accessToken?: string; csrfToken?: string }) => {
  if (tokens?.accessToken) {
    setAccessToken('customer', tokens.accessToken);
  }

  if (tokens?.csrfToken) {
    setCsrfToken('customer', tokens.csrfToken);
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
  updateSnapshot({ customer: null, status: 'unauthenticated', isLoading: false });

  if (broadcast) {
    broadcastAuthStateChange('customer', event);
  }
};

const performRefresh = async (): Promise<CustomerRefreshOutcome> => {
  if (refreshPromise) {
   if (import.meta.env.DEV) {
     logger.debug('CUSTOMER_AUTH_REFRESH_REUSED', 'Using existing refresh promise', {});
   }
   return refreshPromise;
  }

  const currentRevision = ++refreshRevision;
  setSessionState(snapshot.customer, 'refreshing');

  if (import.meta.env.DEV) {
    logger.debug('CUSTOMER_AUTH_REFRESH_STARTED', 'Customer token refresh started', {});
  }

  refreshPromise = (async () => {
    try {
      const csrfToken = getCustomerCsrfToken();
      if (!csrfToken) {
       if (import.meta.env.DEV) {
         logger.debug('CUSTOMER_AUTH_REFRESH_FAILED', 'Missing CSRF token', { reason: 'no_csrf' });
       }
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
      if (isTerminalAuthResponse(response, data)) {
       if (import.meta.env.DEV) {
         logger.debug('CUSTOMER_AUTH_REFRESH_TERMINAL', 'Terminal refresh failure', { status: response.status });
       }
        return { status: 'terminal', message: data?.message || 'Customer session is no longer valid' } as const;
      }

      if (!response.ok) {
       if (import.meta.env.DEV) {
         logger.debug('CUSTOMER_AUTH_REFRESH_TRANSIENT', 'Transient refresh failure', { status: response.status });
       }
        return { status: 'transient', message: data?.message || 'Customer refresh failed' } as const;
      }

      const tokens = extractTokens(data);
      if (!tokens.accessToken) {
       if (import.meta.env.DEV) {
         logger.debug('CUSTOMER_AUTH_REFRESH_FAILED', 'No access token in response', {});
       }
        return { status: 'terminal', message: data?.message || 'Refresh response did not include an access token' } as const;
      }

      const customer = extractCustomer(data);
      if (currentRevision === refreshRevision) {
        setSessionState(customer, 'authenticated', tokens);
       if (import.meta.env.DEV) {
         logger.debug('CUSTOMER_AUTH_REFRESH_SUCCESS', 'Token refresh successful', { hasCustomer: !!customer });
       }
      }

      return { status: 'success', accessToken: tokens.accessToken, customer } as const;
    } catch (error: any) {
      if (isTransientError(error)) {
       if (import.meta.env.DEV) {
         logger.debug('CUSTOMER_AUTH_REFRESH_TRANSIENT', 'Transient refresh error', { errorName: error?.name });
       }
        return { status: 'transient', message: error?.message || 'Customer refresh temporarily failed' } as const;
      }

     if (import.meta.env.DEV) {
       logger.debug('CUSTOMER_AUTH_REFRESH_ERROR', 'Refresh error', { errorName: error?.name, message: error?.message });
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
   if (import.meta.env.DEV) {
     logger.debug('CUSTOMER_AUTH_PROFILE_REUSED', 'Using existing profile promise', {});
   }
   return profilePromise;
  }

  const currentRevision = ++profileRevision;
  updateSnapshot({
    status: snapshot.customer ? 'authenticated' : 'hydrating',
    isLoading: true,
  });

  if (import.meta.env.DEV) {
    logger.debug('CUSTOMER_AUTH_PROFILE_STARTED', 'Customer profile fetch started', {});
  }

  profilePromise = (async () => {
    try {
      if (refreshPromise) {
       if (import.meta.env.DEV) {
         logger.debug('CUSTOMER_AUTH_PROFILE_WAITING_REFRESH', 'Profile waiting for refresh to complete', {});
       }
        const refreshOutcome = await refreshPromise;
        if (refreshOutcome.status === 'terminal') {
         if (import.meta.env.DEV) {
           logger.debug('CUSTOMER_AUTH_PROFILE_FAILED', 'Profile load failed due to terminal refresh', {});
         }
          return refreshOutcome;
        }
      }

      const accessToken = getAccessToken('customer');
      if (!accessToken) {
       if (import.meta.env.DEV) {
         logger.debug('CUSTOMER_AUTH_PROFILE_FAILED', 'No access token available', {});
       }
        return { status: 'terminal', message: 'Missing customer access token' } as const;
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
      if (isTerminalAuthResponse(response, data)) {
       if (import.meta.env.DEV) {
         logger.debug('CUSTOMER_AUTH_PROFILE_TERMINAL', 'Terminal profile failure', { status: response.status });
       }
        performCustomerLogout(CustomerLogoutReason.ProfileLoadFailed);
        return { status: 'terminal', message: data?.message || 'Customer session expired' } as const;
      }

      if (!response.ok) {
       if (import.meta.env.DEV) {
         logger.debug('CUSTOMER_AUTH_PROFILE_TRANSIENT', 'Transient profile failure', { status: response.status });
       }
        return { status: 'transient', message: data?.message || 'Failed to load customer profile' } as const;
      }

      const customer = extractCustomer(data);
      if (!customer) {
       if (import.meta.env.DEV) {
         logger.debug('CUSTOMER_AUTH_PROFILE_FAILED', 'No customer data in response', {});
       }
        return { status: 'terminal', message: data?.message || 'Customer profile missing from response' } as const;
      }

      if (currentRevision === profileRevision) {
        setSessionState(customer, 'authenticated');
       if (import.meta.env.DEV) {
         logger.debug('CUSTOMER_AUTH_PROFILE_SUCCESS', 'Customer profile fetched successfully', { customerId: customer._id });
       }
      }

      return { status: 'success', customer } as const;
    } catch (error: any) {
      if (isTransientError(error)) {
       if (import.meta.env.DEV) {
         logger.debug('CUSTOMER_AUTH_PROFILE_TRANSIENT', 'Transient profile error', { errorName: error?.name });
       }
        return { status: 'transient', message: error?.message || 'Customer profile lookup temporarily failed' } as const;
      }

     if (import.meta.env.DEV) {
       logger.debug('CUSTOMER_AUTH_PROFILE_ERROR', 'Profile fetch error', { errorName: error?.name, message: error?.message });
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
     if (import.meta.env.DEV) {
       logger.debug('CUSTOMER_AUTH_LOGOUT_DEDUPED', 'Logout deduped (same reason within window)', { reason });
     }
    return;
  }

  lastLogoutReason = reason;
  lastLogoutTime = now;

    if (import.meta.env.DEV) {
      logger.debug('CUSTOMER_AUTH_LOGOUT_STARTED', 'Customer logout initiated', { reason });
    }

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

export const bootstrapCustomerAuth = async (pathname: string): Promise<CustomerHydrationOutcome> => {
  if (!pathname.startsWith('/customer')) {
    if (lastBootstrapPathname !== pathname) {
      lastBootstrapPathname = pathname;
     if (import.meta.env.DEV) {
       logger.debug('CUSTOMER_AUTH_BOOT_SKIPPED', 'Auth bootstrap skipped (non-customer route)', { pathname });
     }
      updateSnapshot({
        customer: snapshot.customer,
        status: snapshot.customer ? 'authenticated' : 'unauthenticated',
        isLoading: false,
        bootstrapAttempted: true,
      });
    }

    return snapshot.customer
      ? { status: 'success', customer: snapshot.customer }
      : { status: 'transient', message: 'Customer auth not required on this route' };
  }

  if (hydrationPromise) {
   if (import.meta.env.DEV) {
     logger.debug('CUSTOMER_AUTH_BOOT_REUSED', 'Using existing bootstrap promise', {});
   }
    return hydrationPromise;
  }

  const currentRevision = ++hydrationRevision;
  updateSnapshot({ status: 'hydrating', isLoading: true });

  if (import.meta.env.DEV) {
    logger.debug('CUSTOMER_AUTH_BOOT_STARTED', 'Customer auth bootstrap started', { pathname });
  }

  hydrationPromise = (async () => {
    const refreshOutcome = await performRefresh();

    if (refreshOutcome.status === 'terminal') {
     if (import.meta.env.DEV) {
       logger.debug('CUSTOMER_AUTH_BOOT_TERMINAL', 'Auth bootstrap terminal (refresh failed)', {});
     }
       performCustomerLogout(CustomerLogoutReason.RefreshFailed);
      return { status: 'terminal', message: refreshOutcome.message } as const;
    }

    if (refreshOutcome.status === 'transient') {
     if (import.meta.env.DEV) {
       logger.debug('CUSTOMER_AUTH_BOOT_TRANSIENT', 'Auth bootstrap transient (refresh failed, will retry)', {});
     }
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
     if (import.meta.env.DEV) {
       logger.debug('CUSTOMER_AUTH_BOOT_SUCCESS', 'Auth bootstrap successful', { customerId: profileOutcome.customer._id });
     }
      return profileOutcome;
    }

    if (profileOutcome.status === 'terminal') {
     if (import.meta.env.DEV) {
       logger.debug('CUSTOMER_AUTH_BOOT_TERMINAL', 'Auth bootstrap terminal (profile load failed)', {});
     }
       performCustomerLogout(CustomerLogoutReason.SessionInvalidated);
      return profileOutcome;
    }

    if (currentRevision === hydrationRevision) {
      updateSnapshot({
        status: snapshot.customer ? 'authenticated' : 'recovering',
        isLoading: !snapshot.customer,
      });
    }

   if (import.meta.env.DEV) {
     logger.debug('CUSTOMER_AUTH_BOOT_TRANSIENT', 'Auth bootstrap transient (profile load failed, will retry)', {});
   }
    return profileOutcome;
  })().finally(() => {
    if (hydrationRevision === currentRevision) {
      hydrationPromise = null;
      lastBootstrapPathname = pathname;
      updateSnapshot({
        status: snapshot.customer ? 'authenticated' : snapshot.status === 'recovering' ? 'recovering' : 'unauthenticated',
        isLoading: snapshot.customer ? false : snapshot.status === 'recovering',
        bootstrapAttempted: true,
      });
     if (import.meta.env.DEV) {
       logger.debug('CUSTOMER_AUTH_BOOT_COMPLETE', 'Auth bootstrap completed', {
         status: snapshot.status,
         hasCustomer: !!snapshot.customer,
       });
     }
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
