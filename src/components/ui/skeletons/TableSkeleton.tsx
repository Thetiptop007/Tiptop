import React from "react";
import Skeleton from "../Skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

/**
 * Professional table placeholder to prevent layout jumping
 */
export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  className = "",
}) => {
  return (
    <div className={`w-full overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      <div className="border-b border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} height={16} width={`${100 / columns}%`} className="rounded" />
          ))}
        </div>
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} height={40} width={`${100 / columns}%`} className="rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableSkeleton;
