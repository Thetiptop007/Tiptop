type AuthScope = 'admin' | 'customer';

const accessTokens: Record<AuthScope, string | null> = {
  admin: null,
  customer: null,
};

const csrfTokens: Record<AuthScope, string | null> = {
  admin: null,
  customer: null,
};

const users: Record<AuthScope, unknown | null> = {
  admin: null,
  customer: null,
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

export const setCsrfToken = (scope: AuthScope, token: string | null) => {
  csrfTokens[scope] = token;
};

export const getCsrfToken = (scope: AuthScope): string | null => csrfTokens[scope];

export const clearCsrfToken = (scope: AuthScope) => {
  csrfTokens[scope] = null;
};

export const clearAllCsrfTokens = () => {
  csrfTokens.admin = null;
  csrfTokens.customer = null;
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

export const clearAllAuthState = () => {
  clearAllAccessTokens();
  clearAllAuthUsers();
  clearAllCsrfTokens();
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
