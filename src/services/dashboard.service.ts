import { apiRequest, parseApiResponse } from '../config/api';
import { logger } from '../utils/logger';

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
    const startedAt = performance.now();
    logger.debug('Dashboard request starting', {
      endpoint: 'dashboard/stats',
      path: window.location.pathname,
    });

    if (import.meta.env.DEV) {
      logger.debug('Dashboard request bootstrap state', {
        endpoint: 'dashboard/stats',
        path: window.location.pathname,
      });
    }

    const response = await apiRequest('dashboard/stats');
    const data = await parseApiResponse(response);

    logger.debug('Dashboard request finished', {
      endpoint: 'dashboard/stats',
      status: response.status,
      durationMs: Math.round(performance.now() - startedAt),
    });

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
    logger.error('Dashboard request failed', {
      endpoint: 'dashboard/stats',
      path: window.location.pathname,
      name: (error as Error)?.name,
      message: (error as Error)?.message,
    });
    console.error('Error fetching dashboard data:', error);
    return null;
  }
};
