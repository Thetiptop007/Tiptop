import { describe, it, expect, beforeEach } from 'vitest';
import { getRequestAuthScope } from '../../services/auth-session.store';
import { clearAllAuth } from '../../test/factories/auth.factory';

describe('REGRESSION: Auth Scope on Shared Routes', () => {
  beforeEach(() => {
    clearAllAuth();
  });

  it('FIX: correctly identifies Admin scope for orders/ when on an admin path (Regression from Orders 401 Bug)', () => {
    const endpoint = 'orders/69ffe19ae0/accept';
    const adminPath = '/admin/orders';
    
    // Even if no token is set yet, it should identify the scope correctly based on context
    const scope = getRequestAuthScope(endpoint, adminPath);
    expect(scope).toBe('admin');
  });

  it('FIX: correctly identifies Customer scope for orders/ when on a non-admin path', () => {
    const endpoint = 'orders/my-recent';
    const customerPath = '/customer/orders';
    
    const scope = getRequestAuthScope(endpoint, customerPath);
    expect(scope).toBe('customer');
  });
});
