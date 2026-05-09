type AuthScope = 'admin' | 'customer';
type AuthSyncEventType = 'login' | 'logout' | 'refresh' | 'invalidate';

export const AUTH_SYNC_KEY = 'tiptop-auth-sync';

const accessTokens: Record<AuthScope, string | null> = {
  admin: null,
  customer: null,
};

const csrfTokens: Record<AuthScope, string | null> = {
  admin: null,
  customer: null,
};

const sessionIds: Record<AuthScope, string | null> = {
  admin: null,
  customer: null,
};

const users: Record<AuthScope, unknown | null> = {
  admin: null,
  customer: null,
};

const scopeLocalStorageKeys: Record<AuthScope, string[]> = {
  admin: ['adminToken', 'adminSessionId', 'adminRefreshToken', 'adminEmail', 'adminName', 'adminRole', 'adminUser'],
  customer: ['customerToken', 'customerSessionId', 'customerRefreshToken', 'customerUser'],
};

const clearPersistedScopeState = (scope?: AuthScope) => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  if (scope) {
    scopeLocalStorageKeys[scope].forEach((key) => localStorage.removeItem(key));
    return;
  }

  Object.values(scopeLocalStorageKeys).flat().forEach((key) => localStorage.removeItem(key));
};

export const broadcastAuthStateChange = (scope: AuthScope, event: AuthSyncEventType) => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  const payloadObj = {
    scope,
    event,
    timestamp: Date.now(),
  };

  const payload = JSON.stringify(payloadObj);

  // BroadcastChannel preferred for low-latency cross-tab comms
  try {
    if (typeof (window as any).BroadcastChannel !== 'undefined') {
      const bc = new (window as any).BroadcastChannel('tiptop-auth-sync');
      bc.postMessage(payloadObj);
      bc.close();
    }
  } catch (e) {
    // ignore and fallback to localStorage
  }

  // Write to localStorage to ensure older tabs receive a storage event
  try {
    localStorage.setItem(AUTH_SYNC_KEY, payload);
    localStorage.removeItem(AUTH_SYNC_KEY);
  } catch (e) {
    // ignore
  }
};

// Internal last-seen timestamp per-scope to avoid loops
const lastSeenSync: Record<AuthScope, number> = {
  admin: 0,
  customer: 0,
};

type AuthSyncListener = (payload: { scope: AuthScope; event: AuthSyncEventType; timestamp?: number }) => void;
let listeners: AuthSyncListener[] = [];

export const addAuthSyncListener = (fn: AuthSyncListener) => {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
};

const notifyListeners = (payload: { scope: AuthScope; event: AuthSyncEventType; timestamp?: number }) => {
  try {
    const ts = payload.timestamp || Date.now();
    const scope = payload.scope;
    if (ts <= (lastSeenSync as any)[scope] + 500) return; // dedupe within 500ms
    (lastSeenSync as any)[scope] = ts;
  } catch {}

  listeners.forEach((fn) => {
    try {
      fn(payload as any);
    } catch (e) {
      // swallow
    }
  });
};

// Listen to BroadcastChannel if available and forward to listeners
try {
  if (typeof (window as any).BroadcastChannel !== 'undefined') {
    const bc = new (window as any).BroadcastChannel('tiptop-auth-sync');
    bc.addEventListener('message', (ev: any) => {
      try {
        const payload = ev.data;
        if (payload && (payload.scope === 'admin' || payload.scope === 'customer')) {
          notifyListeners(payload);
        }
      } catch (e) {}
    });
  }
} catch (e) {}

// Also listen to storage events (older browsers/tabs)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (ev: StorageEvent) => {
    const payload = getAuthSyncPayload(ev);
    if (!payload) return;
    notifyListeners(payload as any);
  });
}

/**
 * Validate persisted localStorage keys for a scope and clear if invalid.
 * Returns true if persisted state looked sane, false if it was cleared.
 */
export const validatePersistedAuth = (scope: AuthScope): boolean => {
  if (typeof localStorage === 'undefined') return false;

  const keys = scopeLocalStorageKeys[scope] || [];
  let found = false;

  try {
    for (const key of keys) {
      const v = localStorage.getItem(key);
      if (v) {
        found = true;
        // Basic sanity checks: token looks like JWT
        if (key.toLowerCase().includes('token')) {
          if (typeof v !== 'string' || v.split('.').length < 3) {
            clearPersistedScopeState(scope);
            return false;
          }
        }
        // user sanity: must parse and contain role
        if (key.endsWith('User')) {
          try {
            const u = JSON.parse(v);
            if (!u || (u.role && typeof u.role !== 'string')) {
              clearPersistedScopeState(scope);
              return false;
            }
          } catch (e) {
            clearPersistedScopeState(scope);
            return false;
          }
        }
      }
    }
  } catch (e) {
    clearPersistedScopeState(scope);
    return false;
  }

  return found;
};

export const setAccessToken = (scope: AuthScope, token: string | null) => {
  accessTokens[scope] = token;
};

export const getAccessToken = (scope: AuthScope): string | null => accessTokens[scope];

export const clearAccessToken = (scope: AuthScope) => {
  accessTokens[scope] = null;
};

export const clearAllAccessTokens = () => {
  accessTokens.admin = null;
  accessTokens.customer = null;
};

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

export const setCsrfToken = (scope: AuthScope, token: string | null) => {
  csrfTokens[scope] = token;
};

export const getCsrfToken = (scope: AuthScope): string | null => {
  if (csrfTokens[scope]) return csrfTokens[scope];
  
  // Fallback to cookie if memory is empty (e.g. after refresh)
  const cookieName = `${scope}CsrfToken`;
  const cookieValue = getCookie(cookieName);
  if (cookieValue) {
    csrfTokens[scope] = cookieValue;
    return cookieValue;
  }
  
  return null;
};

export const clearCsrfToken = (scope: AuthScope) => {
  csrfTokens[scope] = null;
};

export const clearAllCsrfTokens = () => {
  csrfTokens.admin = null;
  csrfTokens.customer = null;
};

export const setSessionId = (scope: AuthScope, sessionId: string | null) => {
  sessionIds[scope] = sessionId;
};

export const getSessionId = (scope: AuthScope): string | null => sessionIds[scope];

export const clearSessionId = (scope: AuthScope) => {
  sessionIds[scope] = null;
};

export const clearAllSessionIds = () => {
  sessionIds.admin = null;
  sessionIds.customer = null;
};

export const setAuthUser = (scope: AuthScope, user: unknown | null) => {
  users[scope] = user;
};

export const getAuthUser = (scope: AuthScope) => users[scope];

export const clearAuthUser = (scope: AuthScope) => {
  users[scope] = null;
};

export const clearAllAuthUsers = () => {
  users.admin = null;
  users.customer = null;
};

/**
 * COMPLETE AUTH STATE RESET
 * Clears ALL authentication state for a scope
 * Called on logout to ensure no lingering auth data
 */
export const clearAllAuthState = (scope?: AuthScope) => {
  if (scope) {
    // Clear specific scope only
    clearAccessToken(scope);
    clearCsrfToken(scope);
    clearSessionId(scope);
    clearAuthUser(scope);
    clearPersistedScopeState(scope);
  } else {
    // Clear everything
    clearAllAccessTokens();
    clearAllCsrfTokens();
    clearAllSessionIds();
    clearAllAuthUsers();
    clearPersistedScopeState();
  }
};

export const getAuthSyncPayload = (event: StorageEvent): { scope: AuthScope; event: AuthSyncEventType; timestamp?: number } | null => {
  if (event.key !== AUTH_SYNC_KEY || !event.newValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(event.newValue) as { scope?: AuthScope; event?: AuthSyncEventType; timestamp?: number };
    if (parsed.scope === 'admin' || parsed.scope === 'customer') {
      return {
        scope: parsed.scope,
        event: parsed.event || 'invalidate',
        timestamp: parsed.timestamp,
      };
    }
  } catch {
    return null;
  }

  return null;
};

export const getRequestAuthScope = (endpoint: string, pathname: string = window.location.pathname): AuthScope | null => {
  const normalizedEndpoint = endpoint.replace(/^\//, '');

  if (pathname.startsWith('/admin') || normalizedEndpoint.startsWith('admin/')) {
    return 'admin';
  }

  if (
    pathname.startsWith('/customer') ||
    normalizedEndpoint.startsWith('customer/') ||
    normalizedEndpoint.startsWith('auth/customer/') ||
    normalizedEndpoint.startsWith('orders') ||
    normalizedEndpoint.startsWith('addresses')
  ) {
    return 'customer';
  }

  if (normalizedEndpoint.startsWith('auth/admin/')) {
    return 'admin';
  }

  if (normalizedEndpoint.startsWith('auth/customer/')) {
    return 'customer';
  }

  return null;
};
