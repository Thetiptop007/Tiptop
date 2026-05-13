
import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useAuthStore } from '../../services/auth.store';


interface ProtectedRouteProps {
  children: React.ReactNode;
}

import AppHeader from '../../layout/AppHeader';
import AppSidebar from '../../layout/AppSidebar';
import Backdrop from '../../layout/Backdrop';
import { SidebarProvider } from '../../context/SidebarContext';

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading, authReady } = useAuth();
  
  // Wait for provider hydration to complete
  if (!authReady || isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen xl:flex">
          <div>
            <AppSidebar />
            <Backdrop />
          </div>
          <div className="flex-1 lg:ml-[290px]">
            <AppHeader />
            <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
              <div className="space-y-6">
                <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
                  ))}
                </div>
                <div className="h-96 animate-pulse rounded-2xl bg-gray-50 dark:bg-gray-900" />
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};
