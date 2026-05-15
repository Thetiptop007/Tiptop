import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, updateCurrentUser, type User } from '../services/auth.service';
import { getBusinessInsightsData, type BusinessInsightsData } from '../services/business-insights.service';
import { getDashboardData, type DashboardData } from '../services/dashboard.service';
import { getShopStatus, toggleShopStatus, getSettings, type ShopStatus, type Settings } from '../services/settings.service';
import { 
  getTodayOrders, 
  getAllOrders, 
  type TodayOrdersResponse, 
  type AllOrdersResponse 
} from '../services/order-management.service';
import { 
  getAddresses, 
  createAddress, 
  updateAddress, 
  deleteAddress,
  setDefaultAddress,
  type AddressData
} from '../services/customer-operations.service';
import { 
  getMenuItems, 
  getPopularItems,
  getCategories,
  getMyOrders,
  getMenuItem,
  type Address
} from '../services/customer-web.service';
import { getAccessToken } from '../services/auth-session.store';
import { useAuthStore } from '../services/auth.store';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export const appQueryKeys = {
  currentUser: ['admin', 'current-user'] as const,
  settings: ['settings', 'all'] as const,
  shopStatus: ['settings', 'shop-status'] as const,
  dashboard: ['dashboard', 'stats'] as const,
  businessInsights: ['dashboard', 'business-insights'] as const,
  todayOrders: ['admin', 'orders', 'today'] as const,
  allOrders: (page: number) => ['admin', 'orders', 'all', page] as const,
  addresses: () => ['customer', 'addresses'] as const,
  customerMenu: (filters: any) => ['customer', 'menu', filters] as const,
  popularItems: (limit: number) => ['customer', 'popular', limit] as const,
  categories: ['categories', 'all'] as const,
};

// Default configurations for public/static data
const PUBLIC_STALE_TIME = 60 * 60 * 1000; // 1 hour for very static data
const SEMI_STATIC_STALE_TIME = 5 * 60 * 1000; // 5 mins for menu/items
const DYNAMIC_STALE_TIME = 15 * 1000; // 15 seconds for status/live data


export const useSettingsQuery = () =>
  useQuery<Settings>({
    queryKey: appQueryKeys.settings,
    queryFn: getSettings,
    staleTime: PUBLIC_STALE_TIME,
    gcTime: PUBLIC_STALE_TIME * 2,
    refetchOnWindowFocus: false,
  });

export const useCurrentAdminUserQuery = () => {
  const { isAppReady } = useAuthStore();
  return useQuery<User | null>({
    queryKey: appQueryKeys.currentUser,
    queryFn: getCurrentUser,
    enabled: isAppReady && !!getAccessToken('admin'),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useShopStatusQuery = () =>
  useQuery<ShopStatus>({
    queryKey: appQueryKeys.shopStatus,
    queryFn: getShopStatus,
    staleTime: DYNAMIC_STALE_TIME,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000, // Background poll every 30s
    refetchOnMount: true,
  });

export const useDashboardDataQuery = () => {
  const { isAppReady } = useAuthStore();
  return useQuery<DashboardData | null>({
    queryKey: appQueryKeys.dashboard,
    queryFn: async () => {
      if (import.meta.env.DEV) {
        console.debug('Dashboard query invoked', {
          path: window.location.pathname,
          hasAdminToken: !!getAccessToken('admin'),
        });
      }

      return getDashboardData();
    },
    enabled: isAppReady && !!getAccessToken('admin'),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useBusinessInsightsQuery = () => {
  const { isAppReady } = useAuthStore();
  return useQuery<BusinessInsightsData | null>({
    queryKey: appQueryKeys.businessInsights,
    queryFn: getBusinessInsightsData,
    enabled: isAppReady && !!getAccessToken('admin'),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
};

export const useTodayOrdersQuery = () => {
  const { isAppReady } = useAuthStore();
  return useQuery<TodayOrdersResponse | null>({
    queryKey: appQueryKeys.todayOrders,
    queryFn: getTodayOrders,
    enabled: isAppReady && !!getAccessToken('admin'),
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  });
};

export const useAllOrdersQuery = (page: number) => {
  const { isAppReady } = useAuthStore();
  return useQuery<AllOrdersResponse | null>({
    queryKey: appQueryKeys.allOrders(page),
    queryFn: () => getAllOrders(page),
    enabled: isAppReady && !!getAccessToken('admin'),
    staleTime: 60_000, // History stays stale longer
    refetchOnWindowFocus: false,
  });
};

/**
 * Customer Hooks
 */
export const useAddressesQuery = () => {
  const { customer, authReady } = useCustomerAuth();
  return useQuery({
    queryKey: appQueryKeys.addresses(),
    queryFn: async () => {
      const response = await getAddresses();
      if (response.status === 'success') {
        return response.data.addresses as Address[];
      }
      return [];
    },
    enabled: authReady && !!customer,
  });
};

export const useCustomerMenuInfiniteQuery = (filters: any) => {
  return useInfiniteQuery({
    queryKey: appQueryKeys.customerMenu(filters),
    queryFn: ({ pageParam = 1 }) => getMenuItems({ ...filters, page: pageParam, limit: 12 }),
    getNextPageParam: (lastPage: any) => {
      if (!lastPage || !lastPage.pagination) return undefined;
      const { currentPage, totalPages } = lastPage.pagination;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 300_000,
  });
};

export const useCustomerMenuQuery = (filters: any) => {
  return useQuery({
    queryKey: appQueryKeys.customerMenu(filters),
    queryFn: () => getMenuItems(filters),
    staleTime: SEMI_STATIC_STALE_TIME,
  });
};

export const useMenuItemQuery = (id: string | undefined) => {
  return useQuery({
    queryKey: ['customer', 'menu', 'item', id],
    queryFn: () => getMenuItem(id!),
    enabled: !!id,
    staleTime: 300_000,
  });
};

export const usePopularItemsQuery = (limit: number = 10) => {
  return useQuery({
    queryKey: appQueryKeys.popularItems(limit),
    queryFn: () => getPopularItems(limit),
    staleTime: SEMI_STATIC_STALE_TIME,
  });
};

export const useCategoriesQuery = () => {
  return useQuery({
    queryKey: appQueryKeys.categories,
    queryFn: async () => {
      const cats = await getCategories();
      const offerIndex = cats.findIndex(cat => cat.toLowerCase() === 'offer');
      if (offerIndex > -1) {
        const [offer] = cats.splice(offerIndex, 1);
        return ['All', offer, ...cats];
      }
      return ['All', ...cats];
    },
    staleTime: PUBLIC_STALE_TIME,
    refetchOnWindowFocus: false,
  });
};

/**
 * Orchestration Hook for Public Bootstrap Data
 * Bundles settings, categories, and shop status.
 */
export const usePublicBootstrap = () => {
  const settings = useSettingsQuery();
  const categories = useCategoriesQuery();
  const shopStatus = useShopStatusQuery();

  return {
    settings: settings.data,
    categories: categories.data,
    shopStatus: shopStatus.data,
    isLoading: settings.isLoading || categories.isLoading || shopStatus.isLoading,
    isError: settings.isError || categories.isError || shopStatus.isError,
    queries: { settings, categories, shopStatus }
  };
};


export const useMyOrdersQuery = (filters: any = {}) => {
  const { customer, authReady } = useCustomerAuth();
  return useQuery({
    queryKey: ['customer', 'orders', filters],
    queryFn: () => getMyOrders(filters),
    enabled: authReady && !!customer,
    staleTime: 30_000,
  });
};

/**
 * Mutations
 */
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

export const useAddressMutations = () => {
  const queryClient = useQueryClient();

  const createAddr = useMutation({
    mutationFn: createAddress,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appQueryKeys.addresses() }),
  });

  const updateAddr = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddressData> }) => updateAddress(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appQueryKeys.addresses() }),
  });

  const deleteAddr = useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appQueryKeys.addresses() }),
  });

  const setDefaultAddr = useMutation({
    mutationFn: (id: string) => setDefaultAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appQueryKeys.addresses() }),
  });

  return {
    createAddress: createAddr,
    updateAddress: updateAddr,
    deleteAddress: deleteAddr,
    setDefaultAddress: setDefaultAddr,
  };
};