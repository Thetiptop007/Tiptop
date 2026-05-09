/**
 * Frontend Auth Scope Management
 *
 * Enforces strict session exclusivity:
 * - Only ONE active auth role per browser session
 * - Tracks which role is currently logged in
 * - Blocks switching roles without explicit logout
 * - Provides force logout when violations detected
 */

const AUTH_SCOPE_KEY = 'authScope';
const ADMIN_SCOPE = 'admin';
const CUSTOMER_SCOPE = 'customer';

/**
 * Get the currently active auth scope
 */
export function getAuthScope(): 'admin' | 'customer' | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const scope = localStorage.getItem(AUTH_SCOPE_KEY);
    if (scope === ADMIN_SCOPE || scope === CUSTOMER_SCOPE) {
      return scope as 'admin' | 'customer';
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Set the current auth scope
 */
export function setAuthScope(scope: 'admin' | 'customer' | null): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  try {
    if (scope === null) {
      localStorage.removeItem(AUTH_SCOPE_KEY);
    } else if (scope === ADMIN_SCOPE || scope === CUSTOMER_SCOPE) {
      localStorage.setItem(AUTH_SCOPE_KEY, scope);
    }
  } catch (error) {
    console.error('Failed to set auth scope:', error);
  }
}

/**
 * Validate that user is not trying to log in to a different role
 * without logging out of the current one
 *
 * @param newScope - The scope the user is trying to log in to
 * @returns true if valid (no existing scope or same scope), false if violation
 */
export function validateScopeSwitch(newScope: 'admin' | 'customer'): boolean {
  const existingScope = getAuthScope();

  // If no existing scope, always allow
  if (!existingScope) {
    return true;
  }

  // If same scope, allow (re-login with same role)
  if (existingScope === newScope) {
    return true;
  }

  // If different scope, disallow (would be mixed session)
  return false;
}

/**
 * Clear auth scope when logging out
 */
export function clearAuthScope(): void {
  setAuthScope(null);
}

/**
 * Force logout: Clear all auth data and force page reload
 * Used when mixed session is detected or scope violation occurs
 */
export async function forceLogout(reason: string = 'mixed_session'): Promise<void> {
  try {
    // Try to call logout endpoint to clean backend
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    try {
      // Admin logout attempt
      await fetch(`${apiBase}/auth/admin/logout`, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => null);

      // Customer logout attempt
      await fetch(`${apiBase}/auth/customer/logout`, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => null);
    } catch (error) {
      console.warn('Backend logout failed during force logout, continuing anyway', error);
    }
  } catch (error) {
    console.error('Error during force logout:', error);
  } finally {
    // Clear all frontend state
    try {
      clearAuthScope();
      localStorage.clear();
      sessionStorage?.clear?.();
      
      // Clear cookies manually (browser won't do this for httpOnly)
      // The backend will have already cleared them

      // Reload page to reset all state
      window.location.href = '/';
    } catch (error) {
      console.error('Error clearing auth state:', error);
      window.location.href = '/';
    }
  }
}

/**
 * Called on app bootstrap to validate scope consistency
 * If mixed session detected (both cookies exist), force logout
 */
export async function validateBootstrapScope(): Promise<void> {
  // This is checked in the AuthInitializer component
  // If backend returns MIXED_SESSIONS error, we force logout there
}
