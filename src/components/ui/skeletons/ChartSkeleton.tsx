import React from "react";
import Skeleton from "../Skeleton";

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 350 }) => {
  return (
    <div className="w-full rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width={120} height={20} />
          <Skeleton width={80} height={14} />
        </div>
        <Skeleton width={100} height={32} className="rounded-lg" />
      </div>
      
      <div className="flex items-end justify-between gap-2" style={{ height: height - 100 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton 
            key={i} 
            width="6%" 
            height={`${20 + Math.random() * 60}%`} 
            className="rounded-t-sm" 
          />
        ))}
      </div>
    </div>
  );
};

export default ChartSkeleton;
