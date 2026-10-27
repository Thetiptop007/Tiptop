import { useState } from 'react';
import { useMyOrdersQuery } from '../../hooks/useAppDataQueries';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { useCustomerOrderSocket } from '../../hooks/useCustomerOrderSocket';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { formatOrderNumberForDisplay } from '../../utils/orderNumber';

const getStatusBadge = (status: string) => {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return { bg: 'bg-amber-100 text-amber-800 border-amber-200', text: 'Order Placed' };
    case 'ACCEPTED':
      return { bg: 'bg-blue-100 text-blue-800 border-blue-200', text: 'Preparing Meal' };
    case 'READY':
      return { bg: 'bg-purple-100 text-purple-800 border-purple-200', text: 'Ready for Pickup' };
    case 'DELIVERED':
      return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', text: 'Delivered' };
    case 'CANCELLED':
      return { bg: 'bg-rose-100 text-rose-800 border-rose-200', text: 'Cancelled' };
    default:
      return { bg: 'bg-neutral-100 text-neutral-800 border-neutral-200', text: status };
  }
};

export default function CustomerOrders() {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const queryClient = useQueryClient();
  
  const ordersQuery = useMyOrdersQuery({ sort: '-createdAt', limit: 50 });

  useCustomerOrderSocket(() => {
    queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] });
  });

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-12 py-5 sm:py-10 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-8">
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            ORDER HISTORY
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight mt-0.5 sm:mt-1">
            My Orders
          </h1>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-1.5 sm:gap-2 p-1 rounded-full bg-neutral-200/80 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('current')}
            className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'current'
                ? 'bg-burgundy text-white shadow-xs'
                : 'text-neutral-700 hover:text-burgundy'
            }`}
          >
            Active Orders
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-burgundy text-white shadow-xs'
                : 'text-neutral-700 hover:text-burgundy'
            }`}
          >
            Past History
          </button>
        </div>
      </div>

      <QueryBoundary
        query={ordersQuery}
        loadingComponent={
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-3xl bg-neutral-200 animate-pulse" />
            ))}
          </div>
        }
      >
        {(data) => {
          const orders = data.orders || [];
          const filtered = orders.filter((o: any) =>
            activeTab === 'current'
              ? !['DELIVERED', 'CANCELLED'].includes(o.status.toUpperCase())
              : ['DELIVERED', 'CANCELLED'].includes(o.status.toUpperCase())
          );

          if (filtered.length === 0) {
            return (
              <div className="py-20 text-center rounded-3xl bg-white border border-neutral-200/80 p-8 shadow-2xs">
                <div className="w-16 h-16 rounded-full bg-neutral-100 mx-auto flex items-center justify-center text-neutral-400 mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-base font-extrabold text-neutral-900 mb-1">
                  No {activeTab === 'current' ? 'active' : 'past'} orders
                </h3>
                <p className="text-xs text-neutral-500 mb-6">
                  {activeTab === 'current'
                    ? "You don't have any meals in progress right now."
                    : "You haven't completed any orders yet."}
                </p>
                <Link
                  to="/customer/menu"
                  className="inline-flex px-7 py-3 rounded-full bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-all shadow-sm"
                >
                  Order Something Delicious →
                </Link>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              {filtered.map((order: any) => {
                const badge = getStatusBadge(order.status);
                const orderTime = new Date(order.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={order._id}
                    className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-6"
                  >
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xs sm:text-sm font-extrabold text-neutral-950">
                          #{formatOrderNumberForDisplay(order.orderNumber)}
                        </span>
                        <span className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold border ${badge.bg}`}>
                          {badge.text}
                        </span>
                      </div>

                      <p className="text-[11px] sm:text-xs text-neutral-500">
                        {orderTime} • {order.items?.length || 0} items
                      </p>

                      <p className="text-xs text-neutral-700 font-medium line-clamp-1 sm:line-clamp-none">
                        {order.items?.map((it: any) => `${it.quantity}x ${it.name}`).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-6 pt-2.5 md:pt-0 border-t md:border-t-0 border-neutral-100">
                      <div>
                        <p className="text-[10px] sm:text-[11px] text-neutral-400 font-medium">Total Amount</p>
                        <p className="text-sm sm:text-base font-extrabold text-neutral-950">
                          ₹{
                            order.totalAmount ||
                            order.pricing?.finalAmount ||
                            order.pricing?.itemsTotal ||
                            order.items?.reduce((s: number, it: any) => s + (Number(it.price || 0) * Number(it.quantity || 1)), 0) ||
                            0
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
