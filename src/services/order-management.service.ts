import { apiRequest, parseApiResponse } from '../config/api';

export interface Order {
  id: string;
  orderId: string;
  customer: string;
  phone: string;
  items: Array<{
    name: string;
    portion?: string;
    quantity: number;
    price: number;
  }>;
  itemCount?: number;
  total: number;
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
    const response = await apiRequest(`admin/orders/all?page=${page}&limit=${limit}`);
    const data = await parseApiResponse(response);

    if (data.status === 'success' && data.data) {
      return data.data;
    }

    return null;
  } catch (error) {
    console.error('Error fetching all orders:', error);
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
    let method = 'PATCH';
    
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
          console.error('⚠️ DELIVERED status change only supported for takeaway orders in this flow');
          return false;
        }
        break;
      case 'CANCELLED':
        endpoint = `orders/${orderId}/cancel`;
        console.log('❌ Using /cancel endpoint');
        break;
      default:
        console.error(`⚠️ Unsupported status change: ${newStatus}`);
        return false;
    }
    
    const response = await apiRequest(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
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

    const response = await apiRequest(url);
    const data = await parseApiResponse(response);

    if (data.status === 'success' && data.data) {
      return data.data;
    }

    return null;
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
    
    const response = await apiRequest('admin/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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

