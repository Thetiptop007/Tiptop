
import { Navigate, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useAuthStore } from '../../services/auth.store';


interface CustomerProtectedRouteProps {
  children: React.ReactNode;
}

export const CustomerProtectedRoute = ({ children }: CustomerProtectedRouteProps) => {
  const { customer, isLoading, authReady } = useCustomerAuth();
  const location = useLocation();
  const authStore = useAuthStore();



  // Wait for provider hydration to complete
  if (!authReady || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Simple Customer Header Skeleton */}
        <div className="h-16 border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto flex h-full max-w-lg items-center justify-between">
            <div className="h-8 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-8 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
        
        {/* Main Content Skeleton */}
        <div className="mx-auto max-w-lg p-4 pt-8">
          <div className="space-y-6">
            <div className="h-10 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm dark:bg-gray-800" />
            <div className="space-y-3">
              <div className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
              <div className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return <Navigate to="/customer/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};