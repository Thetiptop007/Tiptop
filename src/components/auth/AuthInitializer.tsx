import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { bootstrapCustomerAuth } from '../../services/customer-auth.coordinator';
import { logger } from '../../utils/logger';

interface AuthInitializerProps {
  onBootComplete: (ready: boolean) => void;
}

/**
 * AuthInitializer handles customer auth bootstrap on page load.
 * 
 * Key responsibilities:
 * 1. Call bootstrapCustomerAuth() when on /customer routes
 * 2. Wait for /me to complete
 * 3. Signal parent that auth is ready
 * 4. Handle errors gracefully
 */
export function AuthInitializer({ onBootComplete }: AuthInitializerProps) {
  const location = useLocation();

  useEffect(() => {
    const initializeAuth = async () => {
      const isCustomerPath = location.pathname.startsWith('/customer');

      if (!isCustomerPath) {
        // Not a customer route, auth not needed
        if (import.meta.env.DEV) {
          logger.debug('AuthInitializer: Skipping auth bootstrap (non-customer route)', {
            pathname: location.pathname,
          });
        }
        onBootComplete(true);
        return;
      }

      if (import.meta.env.DEV) {
        logger.debug('AuthInitializer: Starting auth bootstrap', {
          pathname: location.pathname,
        });
      }

      try {
        // Bootstrap returns when complete or when it hits a terminal error
        const outcome = await bootstrapCustomerAuth(location.pathname);

        if (import.meta.env.DEV) {
          logger.debug('AuthInitializer: Auth bootstrap completed', {
            status: outcome.status,
            pathname: location.pathname,
          });
        }

        // Always signal ready, even on transient errors
        // (user might be able to recover)
        onBootComplete(true);
      } catch (error) {
        logger.error('AuthInitializer: Unexpected bootstrap error', {
          message: error instanceof Error ? error.message : String(error),
        });
        onBootComplete(true);
      }
    };

    void initializeAuth();
  }, [location.pathname, onBootComplete]);

  // This component doesn't render anything
  return null;
}
