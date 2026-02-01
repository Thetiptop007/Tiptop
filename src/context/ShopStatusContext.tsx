import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getShopStatus, ShopStatus } from '../services/settings.service';

interface ShopStatusContextType {
  shopStatus: ShopStatus | null;
  refreshShopStatus: () => Promise<void>;
  isLoading: boolean;
}

const ShopStatusContext = createContext<ShopStatusContextType | undefined>(undefined);

export function ShopStatusProvider({ children }: { children: ReactNode }) {
  const [shopStatus, setShopStatus] = useState<ShopStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const status = await getShopStatus();
      setShopStatus(status);
    } catch (error) {
      console.error('Error fetching shop status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshShopStatus = async () => {
    await fetchStatus();
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <ShopStatusContext.Provider value={{ shopStatus, refreshShopStatus, isLoading }}>
      {children}
    </ShopStatusContext.Provider>
  );
}

export function useShopStatus() {
  const context = useContext(ShopStatusContext);
  if (context === undefined) {
    throw new Error('useShopStatus must be used within a ShopStatusProvider');
  }
  return context;
}
