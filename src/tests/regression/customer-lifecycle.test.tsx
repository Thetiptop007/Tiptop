import { describe, it, expect, beforeEach, vi, afterAll, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Import target components and contexts
import CustomerSignUp from '../../pages/Customer/CustomerSignUp';
import CustomerLogin from '../../pages/Customer/CustomerLogin';
import CustomerMenu from '../../pages/Customer/CustomerMenu';
import ItemDetails from '../../pages/Customer/ItemDetails';
import Cart from '../../pages/Customer/Cart';
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

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), showToast: vi.fn() }),
  ToastProvider: ({ children }: any) => <>{children}</>
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

describe('REGRESSION: Customer Lifecycle & Auth Flow', () => {
  let capturedBody: any = null;

  beforeEach(() => {
    localStorage.clear();
    authStore.reset();
    capturedBody = null;
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } }
    });

    // Reset handlers to global defaults
    server.resetHandlers();
    server.use(
      http.get(/.*\/api\/v1\/settings$/, () => {
        return HttpResponse.json({ status: 'success', data: { contactPhone: '1234567890', shopName: 'TipTop' } });
      }),
      http.get(/.*\/api\/v1\/settings\/shop-status/, () => {
        return HttpResponse.json({ status: 'success', data: { shopStatus: { isOpen: true, message: 'Open' } } });
      }),
      http.post(/\/auth\/customer\/register/, async ({ request }) => {
        const body = await request.clone().json();
        capturedBody = body;
        return HttpResponse.json({ 
          status: 'success', 
          data: { 
            accessToken: 'fake-token',
            user: { _id: 'cust123', name: { first: 'Test', last: 'User' }, role: 'customer' }
          } 
        });
      }),
      http.post(/\/auth\/customer\/login/, async () => {
        return HttpResponse.json({ 
          status: 'success', 
          data: { 
            accessToken: 'fake-token',
            user: { _id: 'cust123', name: { first: 'Test', last: 'User' }, role: 'customer' }
          } 
        });
      }),
      http.get(/\/auth\/customer\/me/, () => {
        return HttpResponse.json({ 
          status: 'success', 
          data: { 
            user: { _id: 'cust123', name: { first: 'Test', last: 'User' }, role: 'customer' }
          } 
        });
      }),
      http.get(/.*\/api\/v1\/menu\/all/, () => {
        return HttpResponse.json({ 
          status: 'success', 
          data: { 
            menuItems: [{
              _id: 'menu1',
              name: 'Test Pizza',
              priceVariants: [{ quantity: 'Regular', price: 500 }],
              isAvailable: true,
              categories: ['Pizza'],
              rating: 4.5,
              reviews: 10
            }], 
            pagination: { totalPages: 1 } 
          } 
        });
      }),
      http.get(/.*\/api\/v1\/menu\/categories.*/, () => {
        return HttpResponse.json({ status: 'success', data: { categories: ['Pizza', 'Burger'] } });
      }),
      http.get(/.*\/api\/v1\/menu\/menu1/, () => {
        console.log('MSW: ItemDetails request received');
        return HttpResponse.json({ 
          status: 'success', 
          data: { 
            menuItem: {
              _id: 'menu1',
              name: 'Test Pizza',
              priceVariants: [{ quantity: 'Regular', price: 500 }],
              isAvailable: true,
              categories: ['Pizza'],
              rating: 4.5,
              reviews: 10,
              description: 'Test Description'
            }
          } 
        });
      }),
      http.get(/.*\/api\/v1\/addresses/, () => {
        return HttpResponse.json({ 
          status: 'success', 
          data: { 
            addresses: [{
              _id: 'addr1',
              type: 'home',
              street: '123 Main St',
              city: 'Phagwara',
              state: 'Punjab',
              zipCode: '144401',
              isDefault: true
            }]
          } 
        });
      }),
      http.post(/.*\/api\/v1\/offers\/check/, () => {
        return HttpResponse.json({ status: 'success', data: [] });
      }),
      http.get(/.*\/api\/v1\/offers\/.*/, () => {
        return HttpResponse.json({ status: 'success', data: [] });
      })
    );
  });

  it('REGRESSION: Customer can sign up successfully', async () => {
    renderWithProviders(<CustomerSignUp />, { initialEntries: ['/customer/signup'] });

    fireEvent.change(screen.getByPlaceholderText(/John Doe/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText(/10-digit phone/i), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByPlaceholderText(/At least 6 characters/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/Re-enter your password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(capturedBody).not.toBeNull(), { timeout: 3000 });
    expect(capturedBody.name).toBe('Test User');
    expect(capturedBody.phone).toBe('9876543210');
    
    await waitFor(() => expect(authStore.getState().user).not.toBeNull());
  });

  it('REGRESSION: Customer can login successfully', async () => {
    renderWithProviders(<CustomerLogin />, { initialEntries: ['/customer/login'] });

    fireEvent.change(screen.getByPlaceholderText(/phone number/i), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
        expect(authStore.getState().user).not.toBeNull();
        expect(authStore.getState().role).toBe('customer');
    });
  });

  it('REGRESSION: Guest can browse menu and add item to cart', async () => {
    renderWithProviders(<CustomerMenu />, { initialEntries: ['/customer/menu'] });

    // 1. Wait for menu to load
    await waitFor(() => expect(screen.getByText(/Test Pizza/i)).toBeInTheDocument(), { timeout: 3000 });

    // 2. Render ItemDetails with Route to capture :id param
    queryClient.clear();
    renderWithProviders(
      <Routes>
        <Route path="/customer/menu/:id" element={<ItemDetails />} />
      </Routes>, 
      { initialEntries: ['/customer/menu/menu1'] }
    );
    
    await waitFor(() => expect(screen.getByText(/Add to Cart/i)).toBeInTheDocument(), { timeout: 3000 });

    // 3. Click "Add to Cart"
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));

    // 4. Verify cart reflects change
    queryClient.clear();
    renderWithProviders(<Cart />, { initialEntries: ['/customer/cart'] });
    
    await waitFor(() => expect(screen.getAllByText(/Test Pizza/i).length).toBeGreaterThan(0));
  });

  it('REGRESSION: Fetches and displays saved addresses for logged-in user', async () => {
    // Mock bootstrap to resolve immediately and not change status
    const bootstrapSpy = vi.spyOn(authCoordinator, 'bootstrapCustomerAuth').mockResolvedValue({
      status: 'success',
      customer: { 
        _id: 'cust123', 
        name: { first: 'Test', last: 'User' }, 
        role: 'customer',
        email: { address: 'test@example.com', isVerified: true },
        phone: { number: '9876543210', isVerified: true },
        isActive: true
      }
    });

    // Manually set auth state to simulate logged-in user using the COORDINATOR
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
    
    // First verify title to ensure component rendered at all
    await waitFor(() => expect(screen.getByText(/Saved Addresses/i)).toBeInTheDocument());
    
    // Wait for the addresses to be loaded and displayed
    await waitFor(() => expect(screen.getByText(/123 Main/i)).toBeInTheDocument(), { timeout: 4000 });
    expect(screen.getByText(/Phagwara/i)).toBeInTheDocument();
    
    bootstrapSpy.mockRestore();
  });
});
