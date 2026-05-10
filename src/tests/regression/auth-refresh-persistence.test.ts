import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiRequest } from '../../config/api';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';
import * as authStore from '../../services/auth-session.store';

describe('REGRESSION: Auth Refresh Persistence', () => {
  beforeEach(() => {
    authStore.clearAllAuthState();
    vi.stubGlobal('location', { pathname: '/admin/dashboard' });
    vi.stubGlobal('navigator', { onLine: true });
  });

  it('FIX: recovers session via refresh token when access token is missing in memory (Regression from Logout-on-Refresh Bug)', async () => {
    // 1. Setup: User has NO access token in memory (simulating fresh page load/hydration)
    // but has a CSRF token (normally read from cookie)
    authStore.setCsrfToken('admin', 'valid-csrf');
    
    // Mock the refresh endpoint to return a new access token
    server.use(
      http.post('*/api/v1/auth/admin/refresh', () => {
        return HttpResponse.json({
          status: 'success',
          data: {
            authenticated: true,
            role: 'admin',
            tokens: { accessToken: 'new-valid-access-token' }
          }
        });
      })
    );

    // Mock a protected endpoint that requires the new token
    server.use(
      http.get('*/api/v1/auth/admin/me', ({ request }) => {
        const auth = request.headers.get('Authorization');
        if (auth === 'Bearer new-valid-access-token') {
          return HttpResponse.json({ status: 'success', data: { role: 'admin' } });
        }
        return new HttpResponse(null, { status: 401 });
      })
    );

    // 2. Action: Try to make an authenticated request
    const response = await apiRequest('auth/admin/me');
    const data = await response.json();

    // 3. Verification:
    // - The request should have succeeded
    // - The new token should be in the store
    expect(response.status).toBe(200);
    expect(data.data.role).toBe('admin');
    expect(authStore.getAccessToken('admin')).toBe('new-valid-access-token');
  });
});
