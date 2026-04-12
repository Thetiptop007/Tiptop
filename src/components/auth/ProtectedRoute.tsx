import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { logger } from '../../utils/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  logger.debug('ProtectedRoute auth check', { isAuthenticated, isLoading });

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

  if (!isAuthenticated) {
    logger.debug('ProtectedRoute redirecting to signin');
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};
