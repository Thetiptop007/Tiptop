import { apiRequest, parseApiResponse } from '../config/api';

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
    street: string;
    city: string;
    state: string;
    zip: string;
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
    const response = await apiRequest('admin/orders/today');
    const data = await parseApiResponse(response);

    if (data.status === 'success' && data.data) {
      console.log('📥 [getTodayOrders] Backend response:', {
        totalOrders: {
          pending: data.data.pending?.length || 0,
          accepted: data.data.accepted?.length || 0,
          preparing: data.data.preparing?.length || 0,
          ready: data.data.ready?.length || 0,
          ready_for_pickup: data.data.ready_for_pickup?.length || 0,
          out_for_delivery: data.data.out_for_delivery?.length || 0,
          delivered: data.data.delivered?.length || 0
        },
        sampleReadyOrder: data.data.ready?.[0] ? {
          orderId: data.data.ready[0].orderId,
          status: data.data.ready[0].status,
          orderType: data.data.ready[0].orderType
        } : 'no ready orders',
        sampleReadyForPickupOrder: data.data.ready_for_pickup?.[0] ? {
          orderId: data.data.ready_for_pickup[0].orderId,
          status: data.data.ready_for_pickup[0].status,
          orderType: data.data.ready_for_pickup[0].orderType
        } : 'no ready_for_pickup orders'
      });
      return data.data;
    }

    return null;
  } catch (error) {
    console.error('Error fetching today orders:', error);
    return null;
  }
};

/**
 * Get all orders with pagination
 */
export const getAllOrders = async (page: number = 1, limit: number = 10): Promise<AllOrdersResponse | null> => {
  try {
    const url = `admin/orders/all?page=${page}&limit=${limit}`;
    const response = await apiRequest(url);
    const data = await parseApiResponse(response);

    if (data.status === 'success' && data.data) {
      return data.data;
    }

    return null;
  } catch (error) {
    console.error('❌ [getAllOrders] Error:', error);
    return null;
  }
};

/**
 * Get single order details
 */
export const getOrderDetails = async (orderId: string): Promise<Order | null> => {
  try {
    console.log('📡 Fetching order details for:', orderId);
    const response = await apiRequest(`admin/orders/${orderId}/details`);
    const data = await parseApiResponse(response);

    console.log('📥 RAW API RESPONSE:', JSON.stringify(data, null, 2));

    if (data.status === 'success' && data.data) {
      console.log('✅ Order data received:', data.data);
      console.log('✅ Pricing in received data:', data.data.pricing);
      return data.data;
    }

    console.log('❌ No data in response');
    return null;
  } catch (error) {
    console.error('❌ Error fetching order details:', error);
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
    console.log(`📦 Updating order ${orderId} to status: ${newStatus}, type: ${orderType}`);
    
    let endpoint = '';
    const method = 'PATCH';
    let requestBody: Record<string, unknown> | undefined;
    
    // Map status to specific backend endpoints
    switch (newStatus) {
      case 'ACCEPTED':
        endpoint = `orders/${orderId}/accept`;
        console.log('✅ Using /accept endpoint (PENDING → ACCEPTED)');
        break;
      case 'READY':
      case 'READY_FOR_PICKUP':
        endpoint = `orders/${orderId}/ready`;
        console.log(`🟢 Using /ready endpoint (ACCEPTED → ${newStatus})`);
        break;
      case 'DELIVERED':
        // For takeaway orders, use complete-takeaway endpoint
        if (orderType === 'TAKEAWAY') {
          endpoint = `orders/${orderId}/complete-takeaway`;
          console.log('✅ Using /complete-takeaway endpoint (READY_FOR_PICKUP → DELIVERED)');
        } else {
          endpoint = `admin/orders/${orderId}/status`;
          requestBody = {
            status: 'DELIVERED',
            notes: 'Marked delivered by admin',
          };
          console.log('✅ Using admin /status endpoint to mark delivery order as DELIVERED');
        }
        break;
      case 'CANCELLED':
        endpoint = `admin/orders/${orderId}/cancel`;
        console.log('❌ Using admin /cancel endpoint');
        break;
      default:
        console.error(`⚠️ Unsupported status change: ${newStatus}`);
        return false;
    }
    
    const response = await apiRequest(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      ...(requestBody ? { body: JSON.stringify(requestBody) } : {})
    });
    
    const data = await parseApiResponse(response);
    
    if (data.status === 'success') {
      console.log(`✅ Order ${orderId} status updated successfully to ${newStatus}`);
      return true;
    }
    
    console.error('❌ Failed to update order status:', data);
    return false;
  } catch (error) {
    console.error('Error updating order status:', error);
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
    });

    const data = await parseApiResponse(response);

    if (data.status === 'success' && data.data) {
      return data.data as BulkStatusUpdateResult;
    }

    return null;
  } catch (error) {
    console.error('Bulk status update failed:', error);
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
      const response = await apiRequest(url);
      const data = await parseApiResponse(response);

      if (data.status === 'success' && data.data) {
        return data.data;
      }

      return null;
    }, 1200);
  } catch (error) {
    console.error('Error fetching POS menu items:', error);
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
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  orderType: 'DELIVERY' | 'TAKEAWAY';
  paymentMethod?: string;
}

export const createAdminOrder = async (orderData: CreateAdminOrderData): Promise<any> => {
  try {
    console.log('📡 Sending order to backend:', orderData);
    
    // Generate idempotency key for this order
    const idempotencyKey = `admin-order-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const response = await apiRequest('admin/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(orderData)
    });
    
    console.log('📥 Raw response:', response);
    
    const data = await parseApiResponse(response);
    console.log('📦 Parsed response:', data);
    
    if (data.status === 'success') {
      return data.data;
    }
    
    // If not success, throw error with details
    throw new Error(data.message || 'Failed to create order');
  } catch (error) {
    console.error('❌ Create order error:', error);
    throw error;
  }
};

// Trigger thermal printer for kitchen bill
export const printKitchenBill = async (orderId: string): Promise<void> => {
  try {
    console.log('🖨️  Triggering thermal printer for order:', orderId);
    
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
      })
    });
    
    const data = await parseApiResponse(response);
    
    if (data.status === 'success' || data.success) {
      console.log('✅ Order marked for thermal printing');
      return;
    }
    
    throw new Error(data.message || 'Failed to mark order for printing');
  } catch (error) {
    console.error('❌ Thermal print error:', error);
    throw error;
  }
};

