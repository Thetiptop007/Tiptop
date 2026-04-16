import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, updateCurrentUser, type User } from '../services/auth.service';
import { getBusinessInsightsData, type BusinessInsightsData } from '../services/business-insights.service';
import { getDashboardData, type DashboardData } from '../services/dashboard.service';
import { getShopStatus, toggleShopStatus, type ShopStatus } from '../services/settings.service';
import { getTodayOrders, type TodayOrdersResponse } from '../services/order-management.service';

export const appQueryKeys = {
  currentUser: ['admin', 'current-user'] as const,
  shopStatus: ['settings', 'shop-status'] as const,
  dashboard: ['dashboard', 'stats'] as const,
  businessInsights: ['dashboard', 'business-insights'] as const,
  todayOrders: ['admin', 'orders', 'today'] as const,
};

export const useCurrentAdminUserQuery = () =>
  useQuery<User | null>({
    queryKey: appQueryKeys.currentUser,
    queryFn: getCurrentUser,
    enabled: !!localStorage.getItem('adminToken'),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useShopStatusQuery = () =>
  useQuery<ShopStatus>({
    queryKey: appQueryKeys.shopStatus,
    queryFn: getShopStatus,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
  });

export const useDashboardDataQuery = () =>
  useQuery<DashboardData | null>({
    queryKey: appQueryKeys.dashboard,
    queryFn: getDashboardData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useBusinessInsightsQuery = () =>
  useQuery<BusinessInsightsData | null>({
    queryKey: appQueryKeys.businessInsights,
    queryFn: getBusinessInsightsData,
    enabled: !!localStorage.getItem('adminToken'),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

export const useTodayOrdersQuery = () =>
  useQuery<TodayOrdersResponse | null>({
    queryKey: appQueryKeys.todayOrders,
    queryFn: getTodayOrders,
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  });

export const useUpdateCurrentAdminUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: (user) => {
      if (user) {
        queryClient.setQueryData(appQueryKeys.currentUser, user);
      }
    },
  });
};

export const useToggleShopStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ isOpen, closureReason }: { isOpen: boolean; closureReason?: string }) =>
      toggleShopStatus(isOpen, closureReason),
    onSuccess: (shopStatus) => {
      queryClient.setQueryData(appQueryKeys.shopStatus, shopStatus);
    },
  });
};