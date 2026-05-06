import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = {
  accessToken: null as string | null,
  csrfToken: null as string | null,
  user: null as any,
};

vi.mock('../../services/auth-session.store', () => ({
  broadcastAuthStateChange: vi.fn(),
  clearAllAuthState: vi.fn((scope?: 'admin' | 'customer') => {
    if (!scope || scope === 'customer') {
      authState.accessToken = null;
      authState.csrfToken = null;
      authState.user = null;
    }
  }),
  getAccessToken: vi.fn(() => authState.accessToken),
  getAuthUser: vi.fn(() => authState.user),
  getCsrfToken: vi.fn(() => authState.csrfToken),
  setAccessToken: vi.fn((_scope: 'admin' | 'customer', token: string | null) => {
    authState.accessToken = token;
  }),
  setAuthUser: vi.fn((_scope: 'admin' | 'customer', user: unknown | null) => {
    authState.user = user;
  }),
  setCsrfToken: vi.fn((_scope: 'admin' | 'customer', token: string | null) => {
    authState.csrfToken = token;
  }),
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    auth: vi.fn(),
    network: vi.fn(),
    ui: vi.fn(),
    business: vi.fn(),
    security: vi.fn(),
    system: vi.fn(),
  },
}));

const makeCustomer = () => ({
  _id: 'customer-1',
  email: { address: 'customer@example.com', isVerified: true },
  phone: { number: '9876543210', isVerified: true },
  name: { first: 'Customer', last: 'One' },
  role: 'customer',
  isActive: true,
});

const makeJsonResponse = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

describe('customer auth coordinator', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    authState.accessToken = null;
    authState.csrfToken = 'csrf-token';
    authState.user = null;
  });

  it('reuses a single in-flight refresh request for concurrent callers', async () => {
    const fetchMock = vi.fn(async () =>
      makeJsonResponse(200, {
        status: 'success',
        data: {
          tokens: { accessToken: 'new-access-token', csrfToken: 'new-csrf-token' },
          user: makeCustomer(),
        },
      })
    );

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const { refreshCustomerSession } = await import('../../services/customer-auth.coordinator');

    const [first, second] = await Promise.all([
      refreshCustomerSession(),
      refreshCustomerSession(),
    ]);

    expect(first.status).toBe('success');
    expect(second.status).toBe('success');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('dedupes bootstrap and /me hydration in the same boot cycle', async () => {
    const customer = makeCustomer();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/auth/customer/refresh')) {
        return makeJsonResponse(200, {
          status: 'success',
          data: {
            tokens: { accessToken: 'refresh-access-token', csrfToken: 'csrf-2' },
            user: customer,
          },
        });
      }

      if (url.includes('/auth/customer/me')) {
        return makeJsonResponse(200, {
          status: 'success',
          data: { user: customer },
        });
      }

      return makeJsonResponse(404, { status: 'fail', message: 'not found' });
    });

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const { bootstrapCustomerAuth } = await import('../../services/customer-auth.coordinator');

    const [first, second] = await Promise.all([
      bootstrapCustomerAuth('/customer/orders'),
      bootstrapCustomerAuth('/customer/orders'),
    ]);

    expect(first.status).toBe('success');
    expect(second.status).toBe('success');

    const refreshCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes('/auth/customer/refresh'));
    const meCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes('/auth/customer/me'));

    expect(refreshCalls).toHaveLength(1);
    expect(meCalls).toHaveLength(1);
  });

  it('waitForCustomerAuthBoot resolves after bootstrap completes', async () => {
    const customer = makeCustomer();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/auth/customer/refresh')) {
        return makeJsonResponse(200, {
          status: 'success',
          data: {
            tokens: { accessToken: 'boot-access-token', csrfToken: 'boot-csrf-token' },
            user: customer,
          },
        });
      }

      return makeJsonResponse(200, {
        status: 'success',
        data: { user: customer },
      });
    });

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const {
      bootstrapCustomerAuth,
      waitForCustomerAuthBoot,
      isCustomerAuthBootComplete,
    } = await import('../../services/customer-auth.coordinator');

    const waitPromise = waitForCustomerAuthBoot();
    expect(isCustomerAuthBootComplete()).toBe(false);

    await bootstrapCustomerAuth('/customer/orders');
    const resolved = await waitPromise;

    expect(resolved).toBe(true);
    expect(isCustomerAuthBootComplete()).toBe(true);
  });
});
