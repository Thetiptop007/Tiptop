import { apiRequest, parseApiResponse } from '../config/api';
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

export interface Order {
  id: string;
  orderId: string;
  customer: string;
  phone: string;
  customerType?: 'GUEST' | 'LOGGED_IN' | 'ADMIN';
  items: Array<{
    name: string;
    portion?: string;
    quantity: number;
    price: number;
  }>;
  itemCount?: number;
  total: number;
  subtotal?: number;
  deliveryFee?: number;
  specialInstructions?: string;
  pricing?: {
    itemsTotal: number;
    deliveryFee: number;
    gst: number;
    gstRate: number;
    discount: number;
    finalAmount: number;
  };
  status: string;
  orderType?: 'DELIVERY' | 'TAKEAWAY';
  date: string;
  time: string;
  address?: {
    area: string;
    addressLine: string;
    landmark?: string;
  };
  image?: string;
  deliveryPartner?: {
    id: string;
    name: string;
    phone: string;
    vehicleNumber?: string;
    assignedAt?: string;
    pickedUpAt?: string;
  };
}

export interface TodayOrdersResponse {
  pending: Order[];
  accepted: Order[];
  preparing: Order[];
  ready: Order[];
  ready_for_pickup?: Order[];
  out_for_delivery: Order[];
  delivered: Order[];
  cancelled: Order[];
}

export interface AllOrdersResponse {
  orders: Order[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    limit: number;
  };
}

export interface BulkStatusUpdateResult {
  totalRequested: number;
  matched: number;
  modified: number;
  skipped: number;
  failed: number;
  failedIds: string[];
}

/**
 * Get today's orders grouped by status
 */
export const getTodayOrders = async (): Promise<TodayOrdersResponse | null> => {
  try {
    const response = await apiRequest('admin/orders/today', { timeoutMs: 30000 });
    const data = await parseApiResponse(response);

    if (data.status === 'success' && data.data) {
      logger.business('TODAY_ORDERS_LOADED', 'Today orders summary loaded', {
        pending: data.data.pending?.length || 0,
        accepted: data.data.accepted?.length || 0,
        preparing: data.data.preparing?.length || 0,
        ready: data.data.ready?.length || 0,
        readyForPickup: data.data.ready_for_pickup?.length || 0,
        outForDelivery: data.data.out_for_delivery?.length || 0,
        delivered: data.data.delivered?.length || 0,
      });
      return data.data;
    }

    return null;
  } catch (error) {
    logger.error('Error fetching today orders', { errorMessage: error instanceof Error ? error.message : String(error) });
    return null;
  }
};

/**
 * Get all orders with pagination
 */
export const getAllOrders = async (page: number = 1, limit: number = 10): Promise<AllOrdersResponse | null> => {
  try {
    const url = `admin/orders/all?page=${page}&limit=${limit}`;
    const response = await apiRequest(url, { timeoutMs: 30000 });
    const data = await parseApiResponse(response);

    if (data.status === 'success' && data.data) {
      return data.data;
    }

    return null;
  } catch (error) {
    logger.error('Error fetching all orders', { errorMessage: error instanceof Error ? error.message : String(error) });
    return null;
  }
};

/**
 * Get single order details
 */
export const getOrderDetails = async (orderId: string): Promise<Order | null> => {
  try {
    logger.network('ORDER_DETAILS_REQUESTED', 'Fetching order details', { orderId });
    const response = await apiRequest(`admin/orders/${orderId}/details`, { timeoutMs: 30000 });
    const data = await parseApiResponse(response);

    if (data.status === 'success' && data.data) {
      logger.network('ORDER_DETAILS_RECEIVED', 'Order details received', {
        orderId,
        orderStatus: data.data.status,
        orderType: data.data.orderType,
        itemCount: data.data.itemCount,
        hasPricing: !!data.data.pricing,
      });
      return data.data;
    }

    logger.warn('No order details returned', { orderId });
    return null;
  } catch (error) {
    logger.error('Error fetching order details', { orderId, errorMessage: error instanceof Error ? error.message : String(error) });
    return null;
  }
};

/**
 * Update order status
 * Uses specific backend endpoints for workflow transitions
 */
export const updateOrderStatus = async (
  orderId: string, 
  newStatus: string, 
  orderType?: 'DELIVERY' | 'TAKEAWAY'
): Promise<boolean> => {
  try {
    logger.business('ORDER_STATUS_UPDATE_REQUESTED', 'Updating order status', {
      orderId,
      newStatus,
      orderType: orderType || 'DELIVERY',
    });
    
    let endpoint = '';
    const method = 'PATCH';
    let requestBody: Record<string, unknown> | undefined;
    
    // Map status to specific backend endpoints
    switch (newStatus) {
      case 'ACCEPTED':
        endpoint = `orders/${orderId}/accept`;
        break;
      case 'READY':
      case 'READY_FOR_PICKUP':
        endpoint = `orders/${orderId}/ready`;
        break;
      case 'DELIVERED':
        // For takeaway orders, use complete-takeaway endpoint
        if (orderType === 'TAKEAWAY') {
          endpoint = `orders/${orderId}/complete-takeaway`;
        } else {
          endpoint = `admin/orders/${orderId}/status`;
          requestBody = {
            status: 'DELIVERED',
            notes: 'Marked delivered by admin',
          };
        }
        break;
      case 'CANCELLED':
        endpoint = `admin/orders/${orderId}/cancel`;
        break;
      default:
        logger.warn('Unsupported status change requested', { orderId, newStatus });
        return false;
    }
    
    const response = await apiRequest(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      ...(requestBody ? { body: JSON.stringify(requestBody) } : {}),
      timeoutMs: 30000,
    });
    
    const data = await parseApiResponse(response);
    
    if (data.status === 'success') {
      logger.business('ORDER_STATUS_UPDATE_SUCCESS', 'Order status updated successfully', { orderId, newStatus });
      return true;
    }
    
    logger.warn('Failed to update order status', {
      orderId,
      newStatus,
      responseStatus: response.status,
      message: data.message,
    });
    return false;
  } catch (error) {
    logger.error('Error updating order status', { orderId, newStatus, errorMessage: error instanceof Error ? error.message : String(error) });
    return false;
  }
};

export const bulkUpdateOrderStatus = async (
  orderIds: string[],
  status: 'ACCEPTED' | 'READY' | 'DELIVERED' | 'CANCELLED'
): Promise<BulkStatusUpdateResult | null> => {
  const payload = {
    orderIds,
    status,
  };

  try {
    const response = await apiRequest('orders/bulk-update-status', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      timeoutMs: 30000,
    });

    const data = await parseApiResponse(response);

    if (data.status === 'success' && data.data) {
      return data.data as BulkStatusUpdateResult;
    }

    return null;
  } catch (error) {
    logger.error('Bulk status update failed', { errorMessage: error instanceof Error ? error.message : String(error) });
    return null;
  }
};

/**
 * Get minimal menu items for POS/Add Order page
 */
export const getPOSMenuItems = async (
  page: number = 1,
  limit: number = 50,
  category?: string,
  search?: string
): Promise<any> => {
  try {
    let url = `admin/orders/pos-menu?page=${page}&limit=${limit}`;
    
    if (category && category !== 'All') {
      url += `&category=${encodeURIComponent(category)}`;
    }
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    return await dedupeRequest(`admin:pos-menu:${url}`, async () => {
      const response = await apiRequest(url, { timeoutMs: 30000 });
      const data = await parseApiResponse(response);

      if (data.status === 'success' && data.data) {
        return data.data;
      }

      return null;
    }, 1200);
  } catch (error) {
    logger.error('Error fetching POS menu items', { errorMessage: error instanceof Error ? error.message : String(error) });
    return null;
  }
};

/**
 * Create order from admin panel
 */
export interface CreateAdminOrderData {
  items: Array<{
    menuItem: string;
    name?: string; // For custom/open menu items
    quantity: number;
    portion?: string;
    price?: number;
  }>;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  deliveryAddress?: {
    area: string;
    addressLine: string;
  };
  orderType: 'DELIVERY' | 'TAKEAWAY';
  paymentMethod?: string;
}

export const createAdminOrder = async (orderData: CreateAdminOrderData): Promise<any> => {
  try {
    logger.business('ADMIN_ORDER_CREATE_REQUESTED', 'Sending admin order to backend', {
      orderType: orderData.orderType,
      itemCount: orderData.items.length,
      hasCustomer: !!orderData.customer,
      hasDeliveryAddress: !!orderData.deliveryAddress,
    });
    
    // Generate idempotency key for this order
    const idempotencyKey = `admin-order-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const response = await apiRequest('admin/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(orderData),
      timeoutMs: 30000,
    });
    
    const data = await parseApiResponse(response);
    
    if (data.status === 'success') {
      logger.business('ADMIN_ORDER_CREATE_SUCCESS', 'Admin order created successfully', { hasOrderData: !!data.data });
      return data.data;
    }
    
    // If not success, throw error with details
    throw new Error(data.message || 'Failed to create order');
  } catch (error) {
    logger.error('Create order error', { errorMessage: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

// Trigger thermal printer for kitchen bill
export const printKitchenBill = async (orderId: string): Promise<void> => {
  try {
    logger.business('THERMAL_PRINT_REQUESTED', 'Triggering thermal printer for order', { orderId });
    
    // Mark order as ready for thermal printing by setting isPrinted to false
    // The thermal printer app polls for orders with isPrinted: false
    const response = await apiRequest(`orders/admin/${orderId}/mark-for-print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isPrinted: false,
        markedAt: new Date().toISOString()
      }),
      timeoutMs: 30000,
    });
    
    const data = await parseApiResponse(response);
    
    if (data.status === 'success') {
      logger.business('THERMAL_PRINT_MARKED', 'Order marked for thermal printing', { orderId });
      return;
    }
    
    throw new Error(data.message || 'Failed to mark order for printing');
  } catch (error) {
    logger.error('Thermal print error', { orderId, errorMessage: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

