import React from "react";

interface QueryLike<T> {
  data: T | undefined | null;
  isLoading: boolean;
  isError: boolean;
  isFetching?: boolean;
  status?: 'error' | 'pending' | 'success';
  fetchStatus?: 'fetching' | 'idle' | 'paused';
  refetch?: () => void;
}


interface QueryBoundaryProps<T> {
  query: QueryLike<T>;
  children: (data: T) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  /** 
   * Custom check for "empty" state. 
   * Default: data is null, undefined, or empty array
   */
  isEmpty?: (data: T) => boolean;
}

/**
 * Standardized Presentation Orchestrator for API-driven UI.
 * - Prevents flickering by keeping stale data visible during refetch.
 * - Handles loading, error, and empty states consistently.
 */
export function QueryBoundary<T>({
  query,
  children,
  loadingComponent,
  emptyComponent,
  errorComponent,
  isEmpty,
}: QueryBoundaryProps<T>) {
  const { data, isLoading, isError, isFetching, status, fetchStatus, refetch } = query;


  // 1. Loading State (Initial mount only)
  // We only show loading if we have NO data. 
  if (isLoading && !data) {
    return <>{loadingComponent}</>;
  }

  // 1.1 Waiting for query to start (enabled: false or idle)
  // If it's idle and we have no data, don't show "No items found" yet, show loading if available.
  if (fetchStatus === 'idle' && !data && status === 'pending') {
    return <>{loadingComponent}</>;
  }


  // 2. Error State
  if (isError && !data) {
    return errorComponent ? (
      <>{errorComponent}</>
    ) : (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="mb-4 rounded-full bg-red-50 p-3 dark:bg-red-900/20">
          <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Failed to load data</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">There was a problem connecting to the server.</p>
        {refetch && (
          <button
            onClick={() => refetch()}
            className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  // 3. Empty State
  const isDataEmpty = isEmpty 
    ? (data !== undefined && data !== null && isEmpty(data))
    : (data === null || data === undefined || (Array.isArray(data) && data.length === 0));

  // Only show empty state if we are NOT loading and NOT currently fetching for the first time
  const isHardLoading = isLoading || (fetchStatus === 'fetching' && !data);
  
  if (isDataEmpty && !isHardLoading) {

    return emptyComponent ? (
      <>{emptyComponent}</>
    ) : (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="mb-4 rounded-full bg-gray-50 p-3 dark:bg-gray-800">
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No items found</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">We couldn't find any data to display here.</p>
      </div>
    );
  }

  // 4. Success State (with optional "Refetching" indicator)
  return (
    <div className="relative w-full">
      {/* Subtle Refetch Indicator (Stale-While-Revalidate feedback) */}
      {isFetching && !isLoading && (
        <div className="absolute top-0 left-0 right-0 z-10 h-0.5 overflow-hidden bg-gray-100 dark:bg-gray-800">
          <div className="h-full w-full animate-progress bg-indigo-600 origin-left" />
        </div>
      )}
      
      {data && children(data)}
    </div>
  );
}

export default QueryBoundary;
