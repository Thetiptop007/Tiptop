import { useState, useEffect } from "react";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import PageMeta from "../../components/common/PageMeta";
import { getDashboardData, DashboardStats } from "../../services/dashboard.service";

// Match the component's expected interface
interface RecentOrder {
  orderNumber: string;
  productName: string;
  productImage: string;
  itemCount: number;
  category: string;
  totalPrice: number;
  status: string;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [monthlySales, setMonthlySales] = useState<number[]>([]);
  const [monthlyTarget, setMonthlyTarget] = useState<{ target: number; currentRevenue: number; progress: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const data = await getDashboardData();
      
      if (data) {
        setStats({
          totalCustomers: data.totalCustomers,
          totalOrders: data.totalOrders
        });
        
        // Transform service data to match component interface
        const transformedOrders: RecentOrder[] = data.recentOrders.map((order: any) => ({
          orderNumber: order.orderNumber || order.orderId || '',
          productName: order.productName || order.items?.[0]?.name || 'N/A',
          productImage: order.productImage || order.image || '',
          itemCount: order.itemCount || order.items?.length || 0,
          category: order.category || 'General',
          totalPrice: order.totalPrice || order.total || 0,
          status: order.status || 'New'
        }));
        
        setRecentOrders(transformedOrders);
        setMonthlySales(data.monthlySales);
        setMonthlyTarget(data.monthlyTarget);
      }
      
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  return (
    <>
      <PageMeta
        title="React.js Ecommerce Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Ecommerce Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics stats={stats} loading={loading} />
          
          <MonthlySalesChart salesData={monthlySales} loading={loading} />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget targetData={monthlyTarget} loading={loading} />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <div className="h-full rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            <img 
              src="https://img.freepik.com/free-vector/restaurant-background_23-2148067523.jpg" 
              alt="Dashboard visualization"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders orders={recentOrders} loading={loading} />
        </div>
      </div>
    </>
  );
}
