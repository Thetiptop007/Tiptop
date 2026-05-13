import PageMeta from "../../components/common/PageMeta";
import React, { Suspense, lazy } from "react";
import { useDashboardOrchestrator } from "../../features/dashboard/useDashboardOrchestrator";
import { QueryBoundary } from "../../components/common/QueryBoundary";
import { StatsSkeleton } from "../../components/ui/skeletons/StatsSkeleton";
import { ChartSkeleton } from "../../components/ui/skeletons/ChartSkeleton";
import { TableSkeleton } from "../../components/ui/skeletons/TableSkeleton";

// Lazy load heavy components
const EcommerceMetrics = lazy(() => import("../../components/ecommerce/EcommerceMetrics"));
const MonthlySalesChart = lazy(() => import("../../components/ecommerce/MonthlySalesChart"));
const MonthlyTarget = lazy(() => import("../../components/ecommerce/MonthlyTarget"));
const RecentOrders = lazy(() => import("../../components/ecommerce/RecentOrders"));

export default function Home() {
  const { query, dashboard } = useDashboardOrchestrator();

  return (
    <>
      <PageMeta
        title="Dashboard | The Tip Top - Restaurant Admin Panel"
        description="View restaurant analytics, sales metrics, and performance for The Tip Top"
      />
      
      <QueryBoundary
        query={query}
        loadingComponent={
          <div className="space-y-6">
            <StatsSkeleton />
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 xl:col-span-7 space-y-6">
                <ChartSkeleton height={200} />
                <ChartSkeleton height={350} />
              </div>
              <div className="col-span-12 xl:col-span-5">
                <ChartSkeleton height={450} />
              </div>
            </div>
          </div>
        }
      >
        {() => (
          <div className="grid grid-cols-12 gap-4 md:gap-6">
            {/* Metrics Section */}
            <div className="col-span-12 space-y-6 xl:col-span-7">
              <Suspense fallback={<StatsSkeleton count={1} />}>
                <EcommerceMetrics stats={dashboard.stats} loading={query.isLoading} />
              </Suspense>
              
              <Suspense fallback={<ChartSkeleton height={350} />}>
                <MonthlySalesChart salesData={dashboard.monthlySales} loading={query.isLoading} />
              </Suspense>
            </div>

            {/* Target Section */}
            <div className="col-span-12 xl:col-span-5">
              <Suspense fallback={<ChartSkeleton height={450} />}>
                <MonthlyTarget targetData={dashboard.monthlyTarget} loading={query.isLoading} />
              </Suspense>
            </div>

            {/* Image Visualization Section */}
            <div className="col-span-12 xl:col-span-5">
              <div className="h-full rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden min-h-[300px]">
                <img 
                  src="https://img.freepik.com/free-vector/restaurant-background_23-2148067523.jpg" 
                  alt="Dashboard visualization"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Recent Orders Section */}
            <div className="col-span-12 xl:col-span-7">
              <Suspense fallback={<TableSkeleton rows={5} />}>
                <RecentOrders orders={dashboard.recentOrders} loading={query.isLoading} />
              </Suspense>
            </div>
          </div>
        )}
      </QueryBoundary>
    </>
  );
}
