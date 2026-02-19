/**
 * Customer Web Service
 * API service for customer-facing web application (order placing by customers)
 * Uses the same backend endpoints as the TiptopApp mobile application
 */

import { apiRequest, parseApiResponse } from '../config/api';

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
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.category && params.category !== 'All') queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.isAvailable !== undefined) queryParams.append('isAvailable', params.isAvailable.toString());
    if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params.minRating) queryParams.append('minRating', params.minRating.toString());

    const url = `/menu?${queryParams.toString()}`;
    const response = await apiRequest(url, { cache: 'no-cache' });
    const data = await parseApiResponse(response);

    // Return the response with pagination from the API response
    return {
      status: data.status || 'success',
      data: {
        menuItems: data.data?.menuItems || []
      },
      pagination: data.pagination
    } as MenuResponse;
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
    const response = await apiRequest('/menu/categories/all');
    const data = await parseApiResponse(response);
    
    if (data.status === 'success' && data.data?.categories) {
      return data.data.categories;
    }
    
    return [];
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
    const response = await apiRequest(`/menu/category/${encodeURIComponent(category)}?limit=${limit}`);
    const data = await parseApiResponse(response);
    
    if (data.status === 'success' && data.data?.menuItems) {
      return data.data.menuItems;
    }
    
    return [];
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

    const response = await apiRequest(`/menu?search=${encodeURIComponent(query)}&limit=${limit}&isAvailable=true`);
    const data = await parseApiResponse(response);
    
    if (data.status === 'success' && data.data?.menuItems) {
      return data.data.menuItems;
    }
    
    return [];
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
    const customerToken = localStorage.getItem('customerToken');
    const endpoint = customerToken ? '/orders' : '/orders/guest/create';
    
    console.log('📦 [createOrder] Creating order:', {
      isAuthenticated: !!customerToken,
      endpoint,
      itemCount: orderData.items.length,
      totalAmount: orderData.totalAmount
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
      console.error('📦 [createOrder] Validation errors:', data.errors);
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    
    throw new Error(data.message || 'Failed to create order');
  } catch (error: any) {
    console.error('Error creating order:', error);
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
    const customerToken = localStorage.getItem('customerToken');
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
    const customerToken = localStorage.getItem('customerToken');
    
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
    const customerToken = localStorage.getItem('customerToken');
    
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
    const token = localStorage.getItem('customerToken');
    
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
    const customerToken = localStorage.getItem('customerToken');
    
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
    const customerToken = localStorage.getItem('customerToken');
    
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
    const customerToken = localStorage.getItem('customerToken');
    
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
