import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCustomerAuth } from '../../context/CustomerAuthContext.tsx';
import { getAccessToken, getAuthUser } from '../../services/auth-session.store';
import { isCustomerAuthBootComplete, waitForCustomerAuthBoot } from '../../services/customer-auth.coordinator';

interface CustomerProtectedRouteProps {
  children: React.ReactNode;
}

export const CustomerProtectedRoute = ({ children }: CustomerProtectedRouteProps) => {
  const { customer, isLoading } = useCustomerAuth();
  const location = useLocation();
  const hasStoredSession = !!getAccessToken('customer') || !!getAuthUser('customer');
  const [bootComplete, setBootComplete] = useState(isCustomerAuthBootComplete());

  useEffect(() => {
    if (!bootComplete) {
      void waitForCustomerAuthBoot().then(() => setBootComplete(true));
    }
  }, [bootComplete]);

  if (!bootComplete) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Initializing...</p>
        </div>
      </div>
    );
  }

  if (isLoading && !hasStoredSession) {
    return <Navigate to="/customer/login" replace state={{ from: location.pathname }} />;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return <Navigate to="/customer/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};