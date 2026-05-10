import { http, HttpResponse } from 'msw';

/**
 * Base handlers for MSW mocking
 */
export const handlers = [
  // Admin Login
  http.post('*/api/v1/auth/admin/login', () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        authenticated: true,
        role: 'admin',
        authVersion: 'v2',
        tokens: {
          accessToken: 'mock-admin-access-token',
        },
        csrfToken: 'mock-admin-csrf-token',
      },
    }, {
      headers: {
        'Set-Cookie': 'adminRefreshToken=mock-admin-refresh-token; Path=/; HttpOnly',
      },
    });
  }),

  // Admin Refresh
  http.post('*/api/v1/auth/admin/refresh', () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        authenticated: true,
        role: 'admin',
        tokens: {
          accessToken: 'refreshed-admin-access-token',
        },
        csrfToken: 'refreshed-admin-csrf-token',
      },
    });
  }),

  // Customer Login
  http.post('*/api/v1/auth/customer/login', () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        authenticated: true,
        role: 'customer',
        tokens: {
          accessToken: 'mock-customer-access-token',
        },
        csrfToken: 'mock-customer-csrf-token',
      },
    });
  }),

  // Shared Orders Endpoint
  http.patch('*/api/v1/orders/:id/accept', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    // Validate if the correct token type is used (we'll check this in tests)
    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json({
      status: 'success',
      message: 'Order accepted successfully',
    });
  }),
];
