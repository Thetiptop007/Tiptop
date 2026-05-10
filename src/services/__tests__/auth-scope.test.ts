import { describe, it, expect } from 'vitest';
import { getRequestAuthScope } from '../auth-session.store';

describe('Auth Scope Detection', () => {
  it('correctly identifies admin scope for explicit admin endpoints', () => {
    expect(getRequestAuthScope('admin/dashboard')).toBe('admin');
    expect(getRequestAuthScope('auth/admin/refresh')).toBe('admin');
    expect(getRequestAuthScope('/admin/orders/today')).toBe('admin');
  });

  it('correctly identifies customer scope for explicit customer endpoints', () => {
    expect(getRequestAuthScope('customer/profile')).toBe('customer');
    expect(getRequestAuthScope('auth/customer/login')).toBe('customer');
    expect(getRequestAuthScope('/addresses/my-home')).toBe('customer');
  });

  it('handles shared "orders/" route based on the current pathname', () => {
    // Shared route: /api/v1/orders/...
    const endpoint = 'orders/123/accept';

    // Case 1: Admin panel
    expect(getRequestAuthScope(endpoint, '/admin/orders')).toBe('admin');
    expect(getRequestAuthScope(endpoint, '/admin/dashboard')).toBe('admin');

    // Case 2: Customer panel
    expect(getRequestAuthScope(endpoint, '/customer/orders')).toBe('customer');
    expect(getRequestAuthScope(endpoint, '/landing')).toBe('customer');
  });

  it('falls back to pathname if endpoint is generic', () => {
    expect(getRequestAuthScope('settings', '/admin/settings')).toBe('admin');
    expect(getRequestAuthScope('settings', '/customer/settings')).toBe('customer');
    expect(getRequestAuthScope('settings', '/')).toBe(null);
  });
});
