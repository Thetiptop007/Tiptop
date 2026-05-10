
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



  // Wait for provider hydration to complete so APIs don't fire prematurely
  if (!authReady || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Initializing customer session...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return <Navigate to="/customer/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};