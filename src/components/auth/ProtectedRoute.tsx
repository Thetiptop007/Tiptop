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

  // Log component mount
  useEffect(() => {
    console.log('[🟢 PROTECTED-ROUTE] MOUNTED', {
      isAuthResolved: authStore.isAuthResolved,
      hasUser: !!authStore.user,
      timestamp: new Date().toISOString(),
    });
    return () => console.log('[🟠 PROTECTED-ROUTE] UNMOUNTED');
  }, []);

  // Trigger admin auth bootstrap on mount if not already resolved
  useEffect(() => {
    console.log('[🔵 PROTECTED-ROUTE] BOOTSTRAP CHECK', {
      isAuthResolved: authStore.isAuthResolved,
      shouldBootstrap: !authStore.isAuthResolved,
      timestamp: new Date().toISOString(),
    });
    if (!authStore.isAuthResolved) {
      console.log('[🔵 PROTECTED-ROUTE] CALLING bootstrapAdminAuth()', new Date().toISOString());
      bootstrapAdminAuth().catch((err) => {
        console.log('[❌ PROTECTED-ROUTE] bootstrapAdminAuth error:', err);
      });
    } else {
      console.log('[⏭️ PROTECTED-ROUTE] SKIPPING bootstrap - already resolved', {
        hasUser: !!authStore.user,
        user: authStore.user ? { _id: authStore.user._id, name: authStore.user.name } : null,
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

  return <>{children}</>;;
};
