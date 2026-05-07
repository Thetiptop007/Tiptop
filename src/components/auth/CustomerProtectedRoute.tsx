import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext.tsx';
import { useAuthStore } from '../../services/auth.store';
import { bootstrapCustomerAuth } from '../../services/customer-auth.coordinator';

interface CustomerProtectedRouteProps {
  children: React.ReactNode;
}

export const CustomerProtectedRoute = ({ children }: CustomerProtectedRouteProps) => {
  const { customer } = useCustomerAuth();
  const location = useLocation();
  const authStore = useAuthStore();

  // Trigger customer auth bootstrap on mount if not already resolved
  useEffect(() => {
    if (!authStore.isAuthResolved) {
      bootstrapCustomerAuth(location.pathname).catch(() => {
        // Bootstrap error handled by coordinator
      });
    }
  }, [authStore.isAuthResolved, location.pathname]);

  // Coordinator sets isAuthResolved when complete
  if (!authStore.isAuthResolved) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!customer || authStore.role !== 'customer') {
    return <Navigate to="/customer/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};