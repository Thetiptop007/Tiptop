import { authStore, type AuthUser } from './auth.store';

let authInitialized = false;
let initPromise: Promise<void> | null = null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const log = (label: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${label}`, data || '');
};

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
  log(`getCsrfToken(${scope})`, { found: !!token });
  return token;
}

/**
 * Detect scope from refresh token cookies
 */
function detectScope(): 'admin' | 'customer' | null {
  const hasAdmin = document.cookie.includes('adminRefreshToken');
  const hasCustomer = document.cookie.includes('customerRefreshToken');
  log('detectScope()', { hasAdmin, hasCustomer });
  
  if (hasAdmin) return 'admin';
  if (hasCustomer) return 'customer';
  return null;
}

/**
 * Call refresh token endpoint with CSRF protection
 */
async function refreshToken(scope: 'admin' | 'customer'): Promise<Response> {
  const csrfToken = getCsrfToken(scope);
  log(`refreshToken(${scope}) START`, { csrfToken: !!csrfToken });

  try {
    const response = await fetch(`/api/v1/auth/${scope}/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
    });
    log(`refreshToken(${scope}) RESPONSE`, { status: response.status, ok: response.ok });
    return response;
  } catch (err) {
    log(`refreshToken(${scope}) FETCH ERROR`, err);
    throw err;
  }
}

/**
 * Call /me endpoint to get current user
 */
async function getMe(scope: 'admin' | 'customer'): Promise<AuthUser | null> {
  const endpoint = scope === 'admin' ? 'auth/admin/me' : 'auth/customer/me';
  log(`getMe(${scope}) START`);

  try {
    const response = await fetch(`/api/v1/${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    log(`getMe(${scope}) RESPONSE`, { status: response.status, ok: response.ok });

    if (!response.ok) {
      log(`getMe(${scope}) NOT OK - returning null`);
      return null;
    }

    const data = await response.json();
    log(`getMe(${scope}) PARSED DATA`, { hasData: !!data?.data });
    return (data.data || null) as AuthUser | null;
  } catch (err) {
    log(`getMe(${scope}) FETCH ERROR`, err);
    throw err;
  }
}

const setResolvedState = (user: AuthUser | null, role: 'admin' | 'customer' | null) => {
  log('setResolvedState()', { user: !!user, role });
  authStore.setState({
    user,
    role,
    isAuthResolved: true,
  });
  authInitialized = true;
  log('authInitialized SET TO TRUE in setResolvedState');
};

export function isAuthReady() {
  log('isAuthReady() called', { authInitialized });
  return authInitialized;
}

export async function waitForAuth() {
  log('waitForAuth() START');

  while (!authInitialized) {
    await sleep(50);
  }

  log('waitForAuth() END - authInitialized is true');
}

export function initAuth() {
  log('initAuth() called');
  
  if (initPromise) {
    log('initAuth() - returning cached promise');
    return initPromise;
  }

  log('initAuth() - starting new promise');

  initPromise = (async () => {
    log('🌍 AUTH INIT PROMISE STARTED');

    try {
      const scope = detectScope();
      log('AUTH INIT: scope detected', { scope });

      if (!scope) {
        log('🚫 NO SESSION FOUND - No refresh tokens in cookies');
        setResolvedState(null, null);
        log('🚫 Called setResolvedState(null, null)');
        return;
      }

      log(`🔍 DETECTED SCOPE: ${scope}`);

      // Attempt refresh token
      log(`AUTH INIT: calling refreshToken(${scope})`);
      const refreshRes = await refreshToken(scope);
      log(`AUTH INIT: refreshToken returned`, { ok: refreshRes.ok, status: refreshRes.status });
      
      if (!refreshRes.ok) {
        log(`❌ REFRESH FAILED [${scope}]`, { status: refreshRes.status });
        log('⏹️ STOPPING AUTH BOOTSTRAP - REFRESH FAILED');
        authInitialized = true;
        log('authInitialized SET TO TRUE (refresh failed)');
        authStore.setState({
          user: null,
          role: null,
          isAuthResolved: true,
        });
        log('authStore.setState called with isAuthResolved: true');
        return;
      }

      log(`✅ REFRESH SUCCESS [${scope}]`, { status: refreshRes.status });

      // Only call /me if refresh succeeded
      log(`AUTH INIT: calling getMe(${scope})`);
      const user = await getMe(scope);
      log(`AUTH INIT: getMe returned`, { user: !!user });

      if (user) {
        log(`✅ AUTH INIT SUCCESS [${scope}]`, { hasUser: true });
        setResolvedState(user, scope);
        log('Called setResolvedState with user');
      } else {
        log(`⚠️ AUTH INIT PARTIAL [${scope}]`, { userLoaded: false });
        authInitialized = true;
        log('authInitialized SET TO TRUE (getMe returned null)');
        authStore.setState({
          user: null,
          role: scope,
          isAuthResolved: true,
        });
        log('authStore.setState called (partial)');
      }
    } catch (error) {
      log('❌ AUTH INIT ERROR', error);
      authInitialized = true;
      log('authInitialized SET TO TRUE (error caught)');
      authStore.setState({
        user: null,
        role: null,
        isAuthResolved: true,
      });
      log('authStore.setState called (error)');
    } finally {
      log('🏁 AUTH INIT FINALLY BLOCK');
      log('Final authInitialized state', { authInitialized });
    }
  })();

  log('initAuth() - promise created, returning');
  return initPromise;
}
