
import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useAuthStore } from '../../services/auth.store';


interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading, authReady } = useAuth();
  const authStore = useAuthStore();

  // Wait for provider hydration to complete so APIs don't fire prematurely
  if (!authReady || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading admin session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};
