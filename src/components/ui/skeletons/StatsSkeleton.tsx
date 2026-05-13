import React from "react";
import Skeleton from "../Skeleton";

interface StatsSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Metric card placeholders for Dashboard and Insights
 */
export const StatsSkeleton: React.FC<StatsSkeletonProps> = ({
  count = 4,
  className = "",
}) => {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-4">
            <Skeleton variant="circle" width={48} height={48} />
            <div className="space-y-2 grow">
              <Skeleton variant="text" width="40%" height={14} />
              <Skeleton variant="text" width="70%" height={24} className="rounded" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Skeleton variant="text" width="30%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsSkeleton;
