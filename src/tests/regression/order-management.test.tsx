import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrderManagement from '../../pages/Orders/OrderManagement';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { loginAsAdmin, clearAllAuth } from '../../test/factories/auth.factory';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { HelmetProvider } from 'react-helmet-async';
import { authStore } from '../../services/auth.store';

import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Wrapper for React Query, Router, and Helmet
const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/orders']}>
          <Routes>
            <Route path="/admin/orders" element={children} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

// Mock the socket context to prevent the Provider error
vi.mock('../../context/SocketContext', () => ({
  useSocket: () => ({
    isConnected: true,
    on: vi.fn(),
    off: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
  }),
  SocketProvider: ({ children }: any) => <>{children}</>
}));

// Mock the toast context to prevent the Provider error
vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
  ToastProvider: ({ children }: any) => <>{children}</>
}));

describe('REGRESSION: Admin Order Management Flow', () => {
  beforeEach(() => {
    clearAllAuth();
    loginAsAdmin();
    authStore.setState({ isAppReady: true });
    vi.stubGlobal('location', { pathname: '/admin/orders' });
  });

  it('FIX: sends correct token scope when Admin accepts an order (Regression from Shared Routes 401)', async () => {
    let capturedScope: string | null = null;

    // 1. Mock the orders list
    server.use(
      http.get('*/api/v1/admin/orders/today', () => {
        return HttpResponse.json({
          status: 'success',
          data: {
            pending: [{
              id: 'order123',
              orderId: 'ORD-123',
              status: 'PENDING',
              total: 500,
              customer: 'Test User',
              items: []
            }],
            accepted: [],
            preparing: [],
            ready: [],
            out_for_delivery: [],
            delivered: [],
            cancelled: []
          }
        });
      })
    );

    // 2. Setup MSW for the action and capture headers
    // The component calls /api/v1/orders/:id/accept
    server.use(
      http.patch('*/api/v1/orders/:id/accept', ({ request }) => {
        capturedScope = request.headers.get('x-token-scope');
        return HttpResponse.json({ status: 'success', data: { order: { id: 'order123', status: 'ACCEPTED' } } });
      }),
      // Also mock details fetch which is triggered after accept
      http.get('*/api/v1/admin/orders/:id/details', () => {
        return HttpResponse.json({ 
          status: 'success', 
          data: { 
            id: 'order123', 
            orderId: 'ORD-123',
            status: 'ACCEPTED',
            customer: 'Test User',
            items: [],
            total: 500,
            date: '2026-05-10',
            time: '12:00 PM',
            address: {
              area: 'Law Gate',
              addressLine: 'House 123'
            }
          } 
        });
      }),
      // Mock for all orders (delivered/cancelled sections)
      http.get('*/api/v1/admin/orders/all', () => {
        return HttpResponse.json({
          status: 'success',
          data: {
            orders: [],
            pagination: { currentPage: 1, totalPages: 1, totalOrders: 0, limit: 10 }
          }
        });
      })
    );

    // Mock window methods that aren't available in JSDOM or throw
    vi.stubGlobal('alert', vi.fn());
    vi.stubGlobal('print', vi.fn());
    vi.stubGlobal('focus', vi.fn());

    render(<OrderManagement />, { wrapper });

    // 3. Find and click "Accept & Print"
    await waitFor(() => expect(screen.getByText(/Test User/i)).toBeInTheDocument());
    const acceptBtn = screen.getByRole('button', { name: /accept & print/i });
    fireEvent.click(acceptBtn);

    // 4. Verify the call was made
    await waitFor(() => expect(capturedScope).toBe('admin'));
  });
});
