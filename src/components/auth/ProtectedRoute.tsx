import { useEffect } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.tsx';
import { useAuthStore } from '../../services/auth.store';
import { bootstrapAdminAuth } from '../../services/admin-auth.coordinator';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuth();
  const authStore = useAuthStore();

  // Trigger admin auth bootstrap on mount if not already resolved
  useEffect(() => {
    if (!authStore.isAuthResolved) {
      bootstrapAdminAuth().catch(() => {
        // Bootstrap error handled by coordinator
      });
    }
  }, [authStore.isAuthResolved]);

  // Coordinator sets isAuthResolved when complete
  if (!authStore.isAuthResolved) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};
