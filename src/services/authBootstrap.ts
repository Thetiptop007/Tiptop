import { authStore, type AuthUser } from './auth.store';

let authInitialized = false;
let initPromise: Promise<void> | null = null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));



/**
 * Read a cookie value by name
 */
function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Extract CSRF token from cookies for a given scope
 */
function getCsrfToken(scope: 'admin' | 'customer'): string | null {
  const tokenName = scope === 'admin' ? 'adminCsrfToken' : 'customerCsrfToken';
  const token = readCookie(tokenName);
  return token;
}

/**
 * Detect scope from refresh token cookies
 */
function detectScope(): 'admin' | 'customer' | null {
  const hasAdmin = document.cookie.includes('adminRefreshToken');
  const hasCustomer = document.cookie.includes('customerRefreshToken');
  
  if (hasAdmin) return 'admin';
  if (hasCustomer) return 'customer';
  return null;
}

/**
 * Call refresh token endpoint with CSRF protection
 */
async function refreshToken(scope: 'admin' | 'customer'): Promise<Response> {
  const csrfToken = getCsrfToken(scope);

  try {
    const response = await fetch(`/api/v1/auth/${scope}/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
    });
    return response;
  } catch (err) {
    throw err;
  }
}

/**
 * Call /me endpoint to get current user
 */
async function getMe(scope: 'admin' | 'customer'): Promise<AuthUser | null> {
  const endpoint = scope === 'admin' ? 'auth/admin/me' : 'auth/customer/me';

  try {
    const response = await fetch(`/api/v1/${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return (data.data || null) as AuthUser | null;
  } catch (err) {
    throw err;
  }
}

const setResolvedState = (user: AuthUser | null, role: 'admin' | 'customer' | null) => {
  authStore.setState({
    user,
    role,
    isAuthResolved: true,
  });
  authInitialized = true;
};

export function isAuthReady() {
  return authInitialized;
}

export async function waitForAuth() {
  while (!authInitialized) {
    await sleep(50);
  }
}

export function initAuth() {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {

    try {
      const scope = detectScope();

      if (!scope) {
        setResolvedState(null, null);
        return;
      }

      const refreshRes = await refreshToken(scope);
      
      if (!refreshRes.ok) {
        authInitialized = true;
        authStore.setState({
          user: null,
          role: null,
          isAuthResolved: true,
        });
        return;
      }

      const user = await getMe(scope);

      if (user) {
        setResolvedState(user, scope);
      } else {
        authInitialized = true;
        authStore.setState({
          user: null,
          role: scope,
          isAuthResolved: true,
        });
      }
    } catch (error) {
      authInitialized = true;
      authStore.setState({
        user: null,
        role: null,
        isAuthResolved: true,
      });
    } 
  })();
  return initPromise;
}
