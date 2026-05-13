import { describe, it, expect, beforeEach, vi, afterAll, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Import target components
import AddOrder from '../../pages/Orders/AddOrder';
import SavedAddresses from '../../pages/Customer/SavedAddresses';
import { CustomerAuthProvider } from '../../context/CustomerAuthContext';
import { ShopStatusProvider } from '../../context/ShopStatusContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { authStore } from '../../services/auth.store';
import { setAccessToken } from '../../services/auth-session.store';
import * as authCoordinator from '../../services/customer-auth.coordinator';

// Environment Setup
(import.meta as any).env.VITE_API_URL = 'http://localhost:5001/api/v1';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterAll(() => server.close());

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), showToast: vi.fn() }),
  ToastProvider: ({ children }: any) => <>{children}</>
}));

// Mock SocketContext
vi.mock('../../context/SocketContext', () => ({
  useSocket: () => ({ isConnected: true, on: vi.fn(), off: vi.fn(), joinRoom: vi.fn(), leaveRoom: vi.fn() }),
  SocketProvider: ({ children }: any) => <>{children}</>
}));

let queryClient: QueryClient;

const renderWithProviders = (ui: React.ReactElement, { initialEntries = ['/'] } = {}) => {
  return render(
    <HelmetProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ShopStatusProvider>
            <MemoryRouter initialEntries={initialEntries}>
              <CustomerAuthProvider>
                {ui}
              </CustomerAuthProvider>
            </MemoryRouter>
          </ShopStatusProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

describe('REGRESSION: Address & Admin Order Operations', () => {
  let capturedBody: any = null;

  beforeEach(() => {
    localStorage.clear();
    authStore.reset();
    capturedBody = null;
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } }
    });

    server.resetHandlers();
    
    // Default handlers
    server.use(
      http.get(/.*\/api\/v1\/settings$/, () => {
        return HttpResponse.json({ status: 'success', data: { settings: { contactPhone: '1234567890', shopName: 'TipTop', businessAddress: 'Phagwara' } } });
      }),
      http.get(/.*\/api\/v1\/settings\/shop-status/, () => {
        return HttpResponse.json({ status: 'success', data: { shopStatus: { isOpen: true, message: 'Open' } } });
      }),
      http.get(/.*\/api\/v1\/admin\/orders\/pos-menu.*/, () => {
        return HttpResponse.json({ 
          status: 'success', 
          data: { 
            items: [{
              id: 'menu1',
              name: 'Test Pizza',
              priceVariants: [{ quantity: 'Regular', price: 500 }],
              category: 'Pizza',
              isAvailable: true
            }]
          } 
        });
      }),
      http.get(/.*\/api\/v1\/admin\/menu-items\/categories.*/, () => {
        return HttpResponse.json({ status: 'success', data: { categories: ['Pizza'] } });
      })
    );
  });

  it('REGRESSION: Admin can place a delivery order with simplified address', async () => {
    server.use(
      http.post(/.*\/api\/v1\/admin\/orders$/, async ({ request }) => {
        capturedBody = await request.clone().json();
        return HttpResponse.json({ 
          status: 'success', 
          data: { order: { orderNumber: '12345', id: 'order1' } } 
        });
      })
    );

    // Set admin auth state
    authStore.setState({ user: { _id: 'admin1', role: 'admin' }, role: 'admin' });
    setAccessToken('admin', 'fake-admin-token');

    renderWithProviders(<AddOrder />, { initialEntries: ['/admin/orders/add'] });

    // 1. Wait for menu and select item
    await waitFor(() => expect(screen.getByText(/Test Pizza/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Test Pizza/i));
    
    // 2. Select variant in modal
    await waitFor(() => expect(screen.getByText(/Regular/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Regular/i));

    // 3. Fill customer details
    fireEvent.change(screen.getByPlaceholderText(/Enter customer name/i), { target: { value: 'Admin Customer' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter phone number/i), { target: { value: '9999999999' } });

    // 4. Address section - Select Area and enter Details
    const lawGateBtn = screen.getByRole('button', { name: /Law Gate/i });
    fireEvent.click(lawGateBtn);
    
    fireEvent.change(screen.getByPlaceholderText(/House No, Apartment name, Landmark etc./i), { 
      target: { value: 'Room 101, PG 1' } 
    });

    // 5. Place order
    const placeOrderBtn = screen.getByRole('button', { name: /Place Order/i });
    fireEvent.click(placeOrderBtn);

    // 6. Verify payload
    await waitFor(() => expect(capturedBody).not.toBeNull());
    expect(capturedBody.deliveryAddress.area).toBe('Law Gate');
    expect(capturedBody.deliveryAddress.addressLine).toBe('Room 101, PG 1');
    expect(capturedBody.customer.name).toBe('Admin Customer');
  });

  it('REGRESSION: Logged-in customer can add a new address using simplified schema', async () => {
    let addressAdded = false;
    server.use(
      http.get(/.*\/api\/v1\/addresses/, () => {
        return HttpResponse.json({ 
          status: 'success', 
          data: { addresses: addressAdded ? [{ _id: 'addr1', type: 'home', area: 'Law Gate', addressLine: 'New House', isDefault: true }] : [] } 
        });
      }),
      http.post(/.*\/api\/v1\/addresses/, async ({ request }) => {
        capturedBody = await request.clone().json();
        addressAdded = true;
        return HttpResponse.json({ status: 'success', data: { address: { _id: 'addr1', ...capturedBody } } });
      })
    );

    // Simulate logged-in customer
    const bootstrapSpy = vi.spyOn(authCoordinator, 'bootstrapCustomerAuth').mockResolvedValue({
      status: 'success',
      customer: { _id: 'cust123', name: { first: 'Test', last: 'User' }, role: 'customer', email: { address: 'test@example.com', isVerified: true }, phone: { number: '9876543210', isVerified: true }, isActive: true }
    });

    await act(async () => {
      setAccessToken('customer', 'fake-token');
      authCoordinator.markCustomerAuthenticated({ 
        _id: 'cust123', 
        name: { first: 'Test', last: 'User' }, 
        role: 'customer',
        email: { address: 'test@example.com', isVerified: true },
        phone: { number: '9876543210', isVerified: true },
        isActive: true
      });
      authStore.setState({ isAppReady: true });
    });

    renderWithProviders(<SavedAddresses />, { initialEntries: ['/customer/addresses'] });

    // 1. Click "Add New"
    await waitFor(() => expect(screen.getByText(/Saved Addresses/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/Add New/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Add New/i));

    // 2. Fill Address Form
    await waitFor(() => expect(screen.getByText(/T Point/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/T Point/i));
    
    fireEvent.change(screen.getByPlaceholderText(/House No, Apartment name, Landmark etc./i), { 
      target: { value: 'Near Metro Station' } 
    });

    // 3. Save
    fireEvent.click(screen.getByRole('button', { name: /Save Address/i }));

    // 4. Verify request
    await waitFor(() => expect(capturedBody).not.toBeNull());
    expect(capturedBody.area).toBe('T Point');
    expect(capturedBody.addressLine).toBe('Near Metro Station');

    bootstrapSpy.mockRestore();
  });
});
