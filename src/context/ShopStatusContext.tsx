import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { appQueryKeys, useShopStatusQuery } from '../hooks/useAppDataQueries';
import { type ShopStatus } from '../services/settings.service';

interface ShopStatusContextType {
  shopStatus: ShopStatus | null;
  refreshShopStatus: (force?: boolean) => Promise<void>;
  setShopStatus: (status: ShopStatus) => void;
  isLoading: boolean;
}

const ShopStatusContext = createContext<ShopStatusContextType | undefined>(undefined);

export function ShopStatusProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: shopStatus = null, isLoading, isFetching } = useShopStatusQuery();

  const setShopStatus = useCallback((status: ShopStatus) => {
    queryClient.setQueryData(appQueryKeys.shopStatus, status);
  }, [queryClient]);

  const refreshShopStatus = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: appQueryKeys.shopStatus, exact: true });
  }, [queryClient]);

  return (
    <ShopStatusContext.Provider value={{ shopStatus, refreshShopStatus, setShopStatus, isLoading: isLoading || isFetching }}>
      {children}
    </ShopStatusContext.Provider>
  );
}

export function useShopStatus() {
  const context = useContext(ShopStatusContext);
  if (context === undefined) {
    if (import.meta.env.DEV) {
      return {
        shopStatus: null,
        refreshShopStatus: async () => undefined,
        setShopStatus: () => undefined,
        isLoading: true,
      };
    }

    throw new Error('useShopStatus must be used within a ShopStatusProvider');
  }

  return context;
}
