import { apiRequest, parseApiResponse } from '../config/api';

export interface DashboardStats {
  totalCustomers: number;
  totalOrders: number;
}

export interface RecentOrder {
  orderNumber: string;
  productName: string;
  productImage: string;
  itemCount: number;
  totalPrice: number;
  status: string;
}

export interface DashboardData {
  totalCustomers: number;
  totalOrders: number;
  recentOrders: RecentOrder[];
  monthlySales: number[];
  monthlyTarget: {
    target: number;
    currentRevenue: number;
    progress: number;
  };
}

/**
 * Fetch dashboard statistics from single optimized endpoint
 * Backend uses MongoDB countDocuments() for performance
 */
export const getDashboardData = async (): Promise<DashboardData | null> => {
  try {
    const response = await apiRequest('dashboard/stats');
    const data = await parseApiResponse(response);

    if (data.status === 'success' && data.data) {
      return {
        totalCustomers: data.data.totalCustomers || 0,
        totalOrders: data.data.totalOrders || 0,
        recentOrders: data.data.recentOrders || [],
        monthlySales: data.data.monthlySales || [],
        monthlyTarget: data.data.monthlyTarget || {
          target: 100000,
          currentRevenue: 0,
          progress: 0
        }
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return null;
  }
};
