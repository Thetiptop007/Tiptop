/**
 * Customer Web Service
 * API service for customer-facing web application (order placing by customers)
 * Uses the same backend endpoints as the TiptopApp mobile application
 */

import { apiRequest, parseApiResponse } from '../config/api';
import { getAccessToken } from './auth-session.store';
import { logger } from '../utils/logger';

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const inFlightRequests = new Map<string, Promise<unknown>>();
const responseCache = new Map<string, CacheEntry<unknown>>();

const dedupeRequest = async <T>(
  key: string,
  request: () => Promise<T>,
  ttlMs = 1500,
): Promise<T> => {
  const now = Date.now();
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const inFlight = inFlightRequests.get(key);
  if (inFlight) {
    return inFlight as Promise<T>;
  }

  const promise = request()
    .then((value) => {
      responseCache.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, promise as Promise<unknown>);
  return promise;
};

// Menu Types
export interface PriceVariant {
  quantity: string;
  price: number;
}

export interface MenuItem {
  _id: string;
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  priceVariants: PriceVariant[];
  categories: string[];
  rating: number;
  reviews: number;
  isAvailable: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuResponse {
  status: string;
  data: {
    menuItems: MenuItem[];
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    limit: number;
  };
}

const FULL_MENU_CACHE_TTL_MS = 60000;
const FULL_MENU_LIMIT = 300;

const getLowestPrice = (item: MenuItem): number => {
  if (!item.priceVariants || item.priceVariants.length === 0) {
    return 0;
  }
  return Math.min(...item.priceVariants.map((variant) => variant.price || 0));
};

const applyMenuSort = (items: MenuItem[], sort?: string): MenuItem[] => {
  if (!sort) {
    return items;
  }

  const sorted = [...items];
  switch (sort) {
    case '-rating':
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'rating':
      return sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    case 'name':
      return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    case '-name':
      return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    case 'price':
      return sorted.sort((a, b) => getLowestPrice(a) - getLowestPrice(b));
    case '-price':
      return sorted.sort((a, b) => getLowestPrice(b) - getLowestPrice(a));
    default:
      return sorted;
  }
};

const getAllMenuSnapshot = async (): Promise<MenuItem[]> => {
  return dedupeRequest('customer:menu-all', async () => {
    const response = await apiRequest(`/menu/all?limit=${FULL_MENU_LIMIT}`);
    const data = await parseApiResponse(response);
    const items = data?.data?.menuItems || [];

    return items.map((item: any) => ({
      ...item,
      id: item.id || item._id,
    })) as MenuItem[];
  }, FULL_MENU_CACHE_TTL_MS);
};

// Order Types
export interface OrderItem {
  menuItem: string; // MongoDB ObjectId
  name: string;
  image?: string;
  portion: string; // The selected variant (Quarter, Half, Full, etc.)
  price: number;
  quantity: number;
  subtotal: number;
}

export interface DeliveryAddress {
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  landmark?: string;
}

export interface CreateOrderData {
  items: OrderItem[];
  deliveryAddress: DeliveryAddress;
  paymentMethod: 'ONLINE' | 'COD' | 'CARD' | 'UPI';
  specialInstructions?: string;
  totalAmount: number;
  deliveryFee: number;
  tip?: number;
  // Guest order fields
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: any;
  items: OrderItem[];
  status: string;
  totalAmount: number;
  deliveryFee: number;
  tip?: number;
  paymentMethod: string;
  deliveryAddress: DeliveryAddress;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDeliveryTime?: Date;
}

// Address Types
export interface Address {
  _id?: string;
  type: 'home' | 'work' | 'other';
  label?: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  landmark?: string;
  isDefault: boolean;
  createdAt?: string;
  // Legacy fields for backward compatibility
  area?: string;
  postalCode?: string;
}

/**
 * ========================================
 * MENU SERVICES
 * ========================================
 */

/**
 * Get all menu items with filters
 */
export const getMenuItems = async (params: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: string;
  isAvailable?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}): Promise<MenuResponse> => {
  try {
    const page = Math.max(params.page || 1, 1);
    const limit = Math.min(Math.max(params.limit || 12, 1), 100);
    const category = params.category && params.category !== 'All' ? params.category.toLowerCase() : null;
    const search = params.search ? params.search.trim().toLowerCase() : null;

    let filteredItems = await getAllMenuSnapshot();

    if (params.isAvailable !== undefined) {
      filteredItems = filteredItems.filter((item) => (item.isAvailable ?? false) === params.isAvailable);
    }

    if (category) {
      filteredItems = filteredItems.filter((item) => {
        const categories = item.categories || [];
        return categories.some((itemCategory) => itemCategory.toLowerCase() === category);
      });
    }

    if (search) {
      filteredItems = filteredItems.filter((item) => {
        const name = (item.name || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        const categories = (item.categories || []).join(' ').toLowerCase();
        return name.includes(search) || description.includes(search) || categories.includes(search);
      });
    }

    if (params.minPrice !== undefined) {
      filteredItems = filteredItems.filter((item) => getLowestPrice(item) >= params.minPrice!);
    }

    if (params.maxPrice !== undefined) {
      filteredItems = filteredItems.filter((item) => getLowestPrice(item) <= params.maxPrice!);
    }

    if (params.minRating !== undefined) {
      filteredItems = filteredItems.filter((item) => (item.rating || 0) >= params.minRating!);
    }

    filteredItems = applyMenuSort(filteredItems, params.sort);

    const totalResults = filteredItems.length;
    const totalPages = Math.max(Math.ceil(totalResults / limit), 1);
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const pagedItems = filteredItems.slice(start, start + limit);

    return {
      status: 'success',
      data: {
        menuItems: pagedItems,
      },
      pagination: {
        currentPage: safePage,
        totalPages,
        totalResults,
        limit,
      },
    };
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
};

/**
 * Get single menu item by ID
 */
export const getMenuItem = async (id: string): Promise<MenuItem> => {
  try {
    const response = await apiRequest(`/menu/${id}`);
    const data = await parseApiResponse(response);
    
    if (data.status === 'success' && data.data?.menuItem) {
      return data.data.menuItem;
    }
    
    throw new Error('Menu item not found');
  } catch (error) {
    console.error('Error fetching menu item:', error);
    throw error;
  }
};

/**
 * Get menu item by slug
 */
export const getMenuItemBySlug = async (slug: string): Promise<MenuItem> => {
  try {
    const response = await apiRequest(`/menu/slug/${slug}`);
    const data = await parseApiResponse(response);
    
    if (data.status === 'success' && data.data?.menuItem) {
      return data.data.menuItem;
    }
    
    throw new Error('Menu item not found');
  } catch (error) {
    console.error('Error fetching menu item by slug:', error);
    throw error;
  }
};

/**
 * Get all categories
 */
export const getCategories = async (): Promise<string[]> => {
  try {
    return await dedupeRequest('customer:menu-categories', async () => {
      const response = await apiRequest('/menu/categories/all');
      const data = await parseApiResponse(response);
      
      if (data.status === 'success' && data.data?.categories) {
        return data.data.categories;
      }
      
      return [];
    }, 30000);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

/**
 * Get popular menu items
 */
export const getPopularItems = async (limit: number = 10): Promise<MenuItem[]> => {
  try {
    const response = await apiRequest(`/menu/popular/items?limit=${limit}`);
    const data = await parseApiResponse(response);
    
    if (data.status === 'success' && data.data?.menuItems) {
      return data.data.menuItems;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching popular items:', error);
    return [];
  }
};

/**
 * Get menu items by category
 */
export const getMenuItemsByCategory = async (category: string, limit: number = 20): Promise<MenuItem[]> => {
  try {
    const response = await getMenuItems({
      category,
      limit,
      page: 1,
      isAvailable: true,
    });
    return response.data?.menuItems || [];
  } catch (error) {
    console.error('Error fetching menu items by category:', error);
    return [];
  }
};

/**
 * Search menu items
 */
export const searchMenu = async (query: string, limit: number = 50): Promise<MenuItem[]> => {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const response = await getMenuItems({
      search: query,
      limit,
      page: 1,
      isAvailable: true,
    });

    return response.data?.menuItems || [];
  } catch (error) {
    console.error('Error searching menu:', error);
    return [];
  }
};

/**
 * ========================================
 * ORDER SERVICES
 * ========================================
 */

/**
 * Create a new order (authenticated customer)
 */
export const createOrder = async (orderData: CreateOrderData): Promise<Order> => {
  try {
    // Check if user is authenticated (has customer token)
    const customerToken = getAccessToken('customer');
    const endpoint = customerToken ? '/orders' : '/orders/guest/create';
    logger.debug('Creating order request', {
      isAuthenticated: !!customerToken,
      endpoint,
      itemCount: orderData.items.length,
    });
    
    const response = await apiRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(customerToken && { 'Authorization': `Bearer ${customerToken}` })
      },
      body: JSON.stringify(orderData),
    });
    
    const data = await parseApiResponse(response);
    
    if (data.status === 'success' && data.data?.order) {
      return data.data.order;
    }
    
    // Handle validation errors with details
    if (data.errors && Array.isArray(data.errors)) {
      const errorMessages = data.errors.map((err: any) => err.message || err.msg || JSON.stringify(err)).join(', ');
      logger.warn('Order validation failed');
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    
    throw new Error(data.message || 'Failed to create order');
  } catch (error: any) {
    logger.error('Error creating order');
    throw error;
  }
};

/**
 * Get customer's orders
 */
export const getMyOrders = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
}): Promise<{ orders: Order[]; pagination?: any }> => {
  try {
    const customerToken = getAccessToken('customer');
    const queryParams = new URLSearchParams();
    
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);

    const url = `/orders/my-orders${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await apiRequest(url, {
      method: 'GET',
      headers: {
        ...(customerToken && { 'Authorization': `Bearer ${customerToken}` })
      }
    });
    const data = await parseApiResponse(response);
    
    if (data.status === 'success') {
      return {
        orders: data.data?.orders || [],
        pagination: data.pagination
      };
    }
    
    return { orders: [] };
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

/**
 * Get single order by ID
 */
export const getOrderById = async (orderId: string): Promise<Order> => {
  try {
    const customerToken = getAccessToken('customer');
    
    const response = await apiRequest(`/orders/${orderId}`, {
      method: 'GET',
      headers: {
        ...(customerToken && { 'Authorization': `Bearer ${customerToken}` })
      }
    });
    const data = await parseApiResponse(response);
    
    if (data.status === 'success' && data.data?.order) {
      return data.data.order;
    }
    
    throw new Error('Order not found');
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

/**
 * Cancel an order
 */
export const cancelOrder = async (orderId: string): Promise<Order> => {
  try {
    const customerToken = getAccessToken('customer');
    
    const response = await apiRequest(`/orders/${orderId}/cancel`, {
      method: 'PATCH',
      headers: {
        ...(customerToken && { 'Authorization': `Bearer ${customerToken}` })
      }
    });
    
    const data = await parseApiResponse(response);
    
    if (data.status === 'success' && data.data?.order) {
      return data.data.order;
    }
    
    throw new Error('Failed to cancel order');
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
};

/**
 * ========================================
 * ADDRESS SERVICES
 * ========================================
 */

/**
 * Get customer's addresses
 */
export const getMyAddresses = async (): Promise<Address[]> => {
  try {
    const token = getAccessToken('customer');
    
    const response = await apiRequest('/addresses', {
      method: 'GET',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    const data = await parseApiResponse(response);
    
    if (data.status === 'success' && data.data?.addresses) {
      return data.data.addresses;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return [];
  }
};

/**
 * Create a new address
 */
export const createAddress = async (address: Omit<Address, '_id'>): Promise<Address> => {
  try {
    const customerToken = getAccessToken('customer');
    
    const response = await apiRequest('/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(customerToken && { 'Authorization': `Bearer ${customerToken}` })
      },
      body: JSON.stringify(address),
    });
    
    const data = await parseApiResponse(response);
    
    if (data.status === 'success' && data.data?.address) {
      return data.data.address;
    }
    
    throw new Error('Failed to create address');
  } catch (error) {
    console.error('Error creating address:', error);
    throw error;
  }
};

/**
 * Update an address
 */
export const updateAddress = async (addressId: string, address: Partial<Address>): Promise<Address> => {
  try {
    const customerToken = getAccessToken('customer');
    
    const response = await apiRequest(`/addresses/${addressId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(customerToken && { 'Authorization': `Bearer ${customerToken}` })
      },
      body: JSON.stringify(address),
    });
    
    const data = await parseApiResponse(response);
    
    if (data.status === 'success' && data.data?.address) {
      return data.data.address;
    }
    
    throw new Error('Failed to update address');
  } catch (error) {
    console.error('Error updating address:', error);
    throw error;
  }
};

/**
 * Delete an address
 */
export const deleteAddress = async (addressId: string): Promise<void> => {
  try {
    const customerToken = getAccessToken('customer');
    
    await apiRequest(`/addresses/${addressId}`, {
      method: 'DELETE',
      headers: {
        ...(customerToken && { 'Authorization': `Bearer ${customerToken}` })
      }
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    throw error;
  }
};

export default {
  // Menu
  getMenuItems,
  getMenuItem,
  getMenuItemBySlug,
  getCategories,
  getPopularItems,
  getMenuItemsByCategory,
  searchMenu,
  
  // Orders
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  
  // Addresses
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};
