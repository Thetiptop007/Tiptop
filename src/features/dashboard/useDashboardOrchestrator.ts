import { useMemo } from 'react';
import { useDashboardDataQuery } from '../../hooks/useAppDataQueries';
import { logger } from '../../utils/logger';

/**
 * Orchestrates Dashboard lifecycle and data derivation.
 * Eliminates waterfalls and manual state syncing.
 */
export function useDashboardOrchestrator() {
  const query = useDashboardDataQuery();
  const { data } = query;

  // Derived metrics for display
  const stats = useMemo(() => {
    if (!data) return null;
    return {
      totalCustomers: data.totalCustomers,
      totalOrders: data.totalOrders,
    };
  }, [data]);

  // Derived orders with UI-safe transformation
  const recentOrders = useMemo(() => {
    if (!data?.recentOrders) return [];

    return data.recentOrders.map((order: any) => ({
      orderNumber: order.orderNumber || order.orderId || '',
      productName: order.productName || order.items?.[0]?.name || 'N/A',
      productImage: order.productImage || order.image || '',
      itemCount: order.itemCount || order.items?.length || 0,
      category: order.category || 'General',
      totalPrice: order.totalPrice || order.total || 0,
      status: order.status || 'New'
    }));
  }, [data]);

  // Grouped dashboard state
  const dashboard = useMemo(() => ({
    stats,
    recentOrders,
    monthlySales: data?.monthlySales || [],
    monthlyTarget: data?.monthlyTarget || null,
  }), [stats, recentOrders, data]);

  // Log lifecycle events for observability
  useMemo(() => {
    if (query.isLoading && !data) {
      logger.lifecycle('DASHBOARD_MOUNT', 'Dashboard is initializing');
    }
    if (data) {
      logger.query('DASHBOARD_LOADED', 'Dashboard data hydration complete', {
        ordersCount: recentOrders.length,
        isStale: query.isStale
      });
    }
  }, [query.isLoading, !!data]);

  return {
    query,
    dashboard,
    refresh: () => {
      logger.ui('DASHBOARD_REFRESH_CLICKED', 'User requested dashboard refresh');
      query.refetch();
    }
  };
}
