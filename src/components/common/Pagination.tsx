import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalResults,
  itemsPerPage,
  onPageChange,
  isLoading = false
}) => {
  if (totalResults === 0 || totalPages <= 1) return null;

  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
      {/* Page Info */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {isLoading ? (
          'Loading...'
        ) : (
          `Showing ${((currentPage - 1) * itemsPerPage) + 1} to ${Math.min(currentPage * itemsPerPage, totalResults)} of ${totalResults} orders`
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            currentPage === 1 || isLoading
              ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          Previous
        </button>

        {/* Page Numbers */}
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            // Show first page, last page, current page, and pages around current
            const showPage =
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1);

            const showEllipsisStart = page === 2 && currentPage > 3;
            const showEllipsisEnd = page === totalPages - 1 && currentPage < totalPages - 2;

            if (showEllipsisStart || showEllipsisEnd) {
              return (
                <span
                  key={`ellipsis-${page}`}
                  className="px-2 py-2 text-sm text-gray-400 dark:text-gray-600"
                >
                  ...
                </span>
              );
            }

            if (!showPage) return null;

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                disabled={isLoading}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  currentPage === page
                    ? "bg-indigo-600 text-white dark:bg-indigo-500"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                } ${isLoading ? 'opacity-50' : ''}`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            currentPage === totalPages || isLoading
              ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};
