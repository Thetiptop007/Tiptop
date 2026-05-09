import { memo, useCallback, useMemo, useState, type ReactNode, Suspense, lazy } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { ArrowUpIcon, BoxIconLine, DollarLineIcon, PieChartIcon, TaskIcon } from "../icons";
import { type TrendPoint } from "../services/business-insights.service";
import { useBusinessInsightsQuery } from "../hooks/useAppDataQueries";
import Skeleton from "../components/ui/Skeleton";

const Chart = lazy(() => import("react-apexcharts"));

type SummaryMetric = {
  title: string;
  value: string;
  change: string;
  direction: "up" | "down";
  icon: ReactNode;
};

const formatCurrency = (value: number): string => `₹${Math.round(value).toLocaleString("en-IN")}`;

const MetricCard = memo(function MetricCard({ metric }: { metric: SummaryMetric }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          {metric.icon}
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            metric.direction === "up"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
          }`}
        >
          <ArrowUpIcon className={`size-3.5 ${metric.direction === "down" ? "rotate-180" : ""}`} />
          {metric.change}
        </span>
      </div>

      <div className="mt-5">
        <span className="text-sm text-gray-500 dark:text-gray-400">{metric.title}</span>
        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{metric.value}</h4>
      </div>
    </div>
  );
});

function SectionCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6 ${
        className || ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      </div>
      <div className="pt-5">{children}</div>
    </div>
  );
}

const RevenueTrendCard = memo(function RevenueTrendCard({
  yearlyTrend,
  monthlyByYear,
  selectedYear,
  onSelectYear,
  onBackToAllYears,
}: {
  yearlyTrend: TrendPoint[];
  monthlyByYear: Record<string, TrendPoint[]>;
  selectedYear: string | null;
  onSelectYear: (year: string) => void;
  onBackToAllYears: () => void;
}) {
  const activeTrendData = useMemo(
    () => (selectedYear ? monthlyByYear[selectedYear] || [] : yearlyTrend),
    [selectedYear, monthlyByYear, yearlyTrend]
  );

  const handleAxisSelect = useCallback(
    (index: number | undefined) => {
      if (selectedYear !== null || typeof index !== "number" || index < 0) {
        return;
      }

      const clickedPoint = activeTrendData[index];
      if (clickedPoint?.label) {
        onSelectYear(clickedPoint.label);
      }
    },
    [selectedYear, activeTrendData, onSelectYear]
  );

  const series = useMemo(
    () => [
      {
        name: "Revenue",
        data: activeTrendData.map((point) => point.revenue),
      },
      {
        name: "Orders",
        data: activeTrendData.map((point) => point.orders),
      },
    ],
    [activeTrendData]
  );

  const options: ApexOptions = useMemo(
    () => ({
      colors: ["#465FFF", "#12B76A"],
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "area",
        height: 340,
        toolbar: { show: false },
        events: {
          xAxisLabelClick: (_event, _chartContext, opts) => {
            handleAxisSelect(opts?.labelIndex);
          },
          dataPointSelection: (_event, _chartContext, opts) => {
            handleAxisSelect(opts?.dataPointIndex);
          },
        },
      },
      stroke: {
        curve: "smooth",
        width: [3, 2],
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.24,
          opacityTo: 0.04,
          stops: [0, 90, 100],
        },
      },
      markers: { size: 4 },
      dataLabels: { enabled: false },
      grid: {
        borderColor: "#E5E7EB",
        strokeDashArray: 4,
        yaxis: { lines: { show: true } },
        xaxis: { lines: { show: false } },
      },
      xaxis: {
        categories: activeTrendData.map((point) => point.label),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: "#6B7280",
            fontFamily: "Outfit, sans-serif",
          },
        },
      },
      yaxis: [
        {
          labels: {
            formatter: (value: number) => `₹${Math.round(value / 1000)}k`,
            style: {
              colors: "#6B7280",
              fontFamily: "Outfit, sans-serif",
            },
          },
        },
        {
          opposite: true,
          labels: {
            formatter: (value: number) => Math.round(value).toString(),
            style: {
              colors: "#6B7280",
              fontFamily: "Outfit, sans-serif",
            },
          },
        },
      ],
      tooltip: {
        y: {
          formatter: (value: number, { seriesIndex }: { seriesIndex: number }) =>
            seriesIndex === 0
              ? `₹${value.toLocaleString("en-IN")}`
              : `${Math.round(value).toLocaleString("en-IN")} orders`,
        },
      },
      legend: {
        position: "top",
        horizontalAlign: "left",
        fontFamily: "Outfit, sans-serif",
        markers: { size: 10 },
      },
    }),
    [activeTrendData, handleAxisSelect]
  );

  return (
    <SectionCard
      title="Orders / Revenue Trend"
      subtitle={
        selectedYear
          ? `Monthly performance for ${selectedYear}`
          : "Yearly performance from business launch to current year (click year on x-axis to drill down)"
      }
      className="h-full"
    >
      {selectedYear !== null && (
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={onBackToAllYears}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Back to All Years
          </button>
        </div>
      )}

      <div className={`w-full pl-1 pr-2 ${selectedYear === null ? "insights-year-clickable" : ""}`}>
        <Chart options={options} series={series} type="area" height={340} />
      </div>

      <style>{`
        .insights-year-clickable .apexcharts-xaxis-texts-g text {
          cursor: pointer;
        }
      `}</style>
    </SectionCard>
  );
});

export default function BusinessInsights() {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const { data: insights, isLoading: loading, error } = useBusinessInsightsQuery();
  const errorMessage = error instanceof Error ? error.message : error ? 'Failed to load business insights.' : null;
  const hasError = Boolean(errorMessage);

  const summaryMetrics = useMemo<SummaryMetric[]>(() => {
    const summary = hasError ? null : insights?.summary;

    return [
      {
        title: "Today's Revenue",
        value: formatCurrency(summary?.todayRevenue || 0),
        change: `${(summary?.changes?.todayRevenuePct ?? 0) >= 0 ? "+" : ""}${(summary?.changes?.todayRevenuePct ?? 0).toFixed(1)}%`,
        direction: (summary?.changes?.todayRevenuePct ?? 0) >= 0 ? "up" : "down",
        icon: <DollarLineIcon className="size-6" />,
      },
      {
        title: "Today Orders",
        value: (summary?.todayOrders || 0).toLocaleString("en-IN"),
        change: `${(summary?.changes?.todayOrdersPct ?? 0) >= 0 ? "+" : ""}${(summary?.changes?.todayOrdersPct ?? 0).toFixed(1)}%`,
        direction: (summary?.changes?.todayOrdersPct ?? 0) >= 0 ? "up" : "down",
        icon: <TaskIcon className="size-6" />,
      },
      {
        title: "Today Avg Order Value",
        value: formatCurrency(summary?.todayAvgOrderValue || 0),
        change: "Live",
        direction: "up",
        icon: <BoxIconLine className="size-6" />,
      },
      {
        title: "Total Avg Order Value",
        value: formatCurrency(summary?.totalAvgOrderValue || 0),
        change: "Overall",
        direction: "up",
        icon: <PieChartIcon className="size-6" />,
      },
    ];
  }, [hasError, insights]);

  const yearlyTrend = useMemo(() => (hasError ? [] : insights?.trends?.yearly || []), [hasError, insights]);
  const monthlyByYear = useMemo(() => (hasError ? {} : insights?.trends?.monthlyByYear || {}), [hasError, insights]);

  const handleSelectYear = useCallback((year: string) => {
    setSelectedYear(year);
  }, []);

  const handleBackToAllYears = useCallback(() => {
    setSelectedYear(null);
  }, []);

  return (
    <>
      <PageMeta
        title="Business Insights | Admin Dashboard"
        description="Restaurant business analytics and performance snapshot"
      />
      <PageBreadcrumb pageTitle="Business Insights" />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
            {loading
              ? [1, 2, 3, 4].map((id) => (
                  <div
                    key={id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Skeleton variant="rect" width={48} height={48} className="rounded-xl" />
                      <Skeleton variant="rect" width={60} height={24} className="rounded-full" />
                    </div>
                    <div className="mt-5 space-y-2">
                      <Skeleton variant="text" width="60%" height={16} />
                      <Skeleton variant="text" width="80%" height={28} />
                    </div>
                  </div>
                ))
              : summaryMetrics.map((metric) => <MetricCard key={metric.title} metric={metric} />)}
          </div>
        </div>

        <div className="col-span-12 h-full">
          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {errorMessage}
            </div>
          ) : (
            <Suspense fallback={<Skeleton height={400} className="rounded-2xl" />}>
              <RevenueTrendCard
                yearlyTrend={yearlyTrend}
                monthlyByYear={monthlyByYear}
                selectedYear={selectedYear}
                onSelectYear={handleSelectYear}
                onBackToAllYears={handleBackToAllYears}
              />
            </Suspense>
          )}
        </div>
      </div>
    </>
  );
}
