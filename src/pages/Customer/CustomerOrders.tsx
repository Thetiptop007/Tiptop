import { useState } from 'react';
import { useMyOrdersQuery } from '../../hooks/useAppDataQueries';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { useCustomerOrderSocket } from '../../hooks/useCustomerOrderSocket';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

const getStatusInfo = (status: string) => {
  switch (status.toUpperCase()) {
    case 'PENDING': return { color: 'bg-blue-500', text: 'Placed' };
    case 'ACCEPTED': return { color: 'bg-orange-500', text: 'Preparing' };
    case 'READY': return { color: 'bg-purple-500', text: 'Ready' };
    case 'DELIVERED': return { color: 'bg-green-500', text: 'Delivered' };
    case 'CANCELLED': return { color: 'bg-red-500', text: 'Cancelled' };
    default: return { color: 'bg-gray-500', text: status };
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
    <div className="min-h-screen pb-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          My Orders
        </h1>

        <div className="flex gap-2 mb-6">
          {(['current', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab
                  ? 'bg-brand-500 text-white shadow-lg shadow-blue-100 dark:shadow-none'
                  : 'bg-gray-100 dark:bg-white/[0.03] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              {tab === 'current' ? 'Active' : 'History'}
            </button>
          ))}
        </div>

        <QueryBoundary query={ordersQuery}>
          {(data) => {
            const filtered = data.orders.filter((o: any) => 
              activeTab === 'current' 
                ? !['DELIVERED', 'CANCELLED'].includes(o.status.toUpperCase())
                : ['DELIVERED', 'CANCELLED'].includes(o.status.toUpperCase())
            );

            if (filtered.length === 0) {
              return (
                <div className="text-center py-20 bg-gray-50 dark:bg-white/[0.03] rounded-3xl border border-gray-100 dark:border-gray-800">
                  <div className="text-4xl mb-4 text-gray-400">📦</div>
                  <h3 className="font-bold text-gray-800 dark:text-white/90">No orders here</h3>
                  <p className="text-sm text-gray-500 mt-1">Check out our menu to place an order!</p>
                  <Link 
                    to="/customer/menu" 
                    className="mt-6 inline-block bg-brand-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-brand-600 transition-colors shadow-sm shadow-blue-200 dark:shadow-none"
                  >
                    Browse Menu
                  </Link>
                </div>
              );
            }

            return (
              <div className="grid gap-4">
                {filtered.map((order: any) => {
                  const status = getStatusInfo(order.status);
                  return (
                    <Link
                      key={order._id}
                      to={`/customer/orders/${order._id}`}
                      className="group bg-white dark:bg-white/[0.03] p-5 rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-brand-500 hover:shadow-xl transition-all block"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs font-bold text-brand-500 mb-1">#{order.orderNumber}</p>
                          <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`${status.color} text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider`}>
                          {status.text}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        {order.items.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{item.quantity}x {item.name}</span>
                            <span className="font-bold text-gray-900 dark:text-white">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total Amount</span>
                        <span className="text-lg font-black text-brand-500">₹{(order.pricing?.finalAmount || order.totalAmount).toFixed(2)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          }}
        </QueryBoundary>
      </div>
    </div>
  );
}
