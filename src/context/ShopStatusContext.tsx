import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getShopStatus, ShopStatus } from '../services/settings.service';

interface ShopStatusContextType {
  shopStatus: ShopStatus | null;
  refreshShopStatus: (force?: boolean) => Promise<void>;
  setShopStatus: (status: ShopStatus) => void;
  isLoading: boolean;
}

const ShopStatusContext = createContext<ShopStatusContextType | undefined>(undefined);

export function ShopStatusProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [shopStatus, setShopStatusState] = useState<ShopStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const lastFetchedAtRef = useRef(0);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const requestCooldownMs = 10000;

  const setShopStatus = useCallback((status: ShopStatus) => {
    setShopStatusState(status);
    lastFetchedAtRef.current = Date.now();
  }, []);

  const fetchStatus = useCallback(async (force = false) => {
    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    if (!force && Date.now() - lastFetchedAtRef.current < requestCooldownMs) {
      return;
    }

    const request = (async () => {
      setIsLoading(true);
      try {
        const status = await getShopStatus();
        setShopStatusState(status);
        lastFetchedAtRef.current = Date.now();
      } catch {
        // Keep existing state if request fails; UI can continue with last known value.
      } finally {
        setIsLoading(false);
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = request;

    try {
      await request;
    } catch {
      // Errors are handled internally to avoid unhandled rejections in effects.
    }
  }, []);

  const refreshShopStatus = useCallback(async (force = false) => {
    await fetchStatus(force);
  }, [fetchStatus]);

  useEffect(() => {
    const path = location.pathname;
    const shouldFetch = ![
      '/signin',
      '/signup',
      '/privacy-policy',
    ].includes(path);

    if (shouldFetch) {
      void fetchStatus();
    }
  }, [location.pathname, fetchStatus]);

  useEffect(() => {
    const handleFocusRefresh = () => {
      void fetchStatus();
    };

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === 'visible') {
        void fetchStatus();
      }
    };

    window.addEventListener('focus', handleFocusRefresh);
    document.addEventListener('visibilitychange', handleVisibilityRefresh);

    return () => {
      window.removeEventListener('focus', handleFocusRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityRefresh);
    };
  }, [fetchStatus]);

  return (
    <ShopStatusContext.Provider value={{ shopStatus, refreshShopStatus, setShopStatus, isLoading }}>
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
