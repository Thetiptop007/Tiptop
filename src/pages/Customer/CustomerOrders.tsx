import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMyOrders, Order } from '../../services/customer-web.service';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useCustomerOrderSocket } from '../../hooks/useCustomerOrderSocket';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../context/SocketContext';

// Status info helper function - matches mobile app
const getStatusInfo = (status: string) => {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return { color: 'bg-blue-500', icon: '✓', text: 'Placed' };
    case 'ACCEPTED':
      return { color: 'bg-orange-500', icon: '🍳', text: 'Preparing' };
    case 'READY':
      return { color: 'bg-purple-500', icon: '✓', text: 'Ready' };
    case 'ASSIGNED':
      return { color: 'bg-purple-500', icon: '🚴', text: 'Assigned' };
    case 'OUT_FOR_DELIVERY':
      return { color: 'bg-purple-500', icon: '🚗', text: 'Delivery' };
    case 'DELIVERED':
      return { color: 'bg-green-500', icon: '✓✓', text: 'Delivered' };
    case 'CANCELLED':
      return { color: 'bg-red-500', icon: '✕', text: 'Cancelled' };
    default:
      return { color: 'bg-gray-500', icon: '?', text: status || 'Unknown' };
  }
};

export default function CustomerOrders() {
  const { customer, authReady } = useCustomerAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const queryClient = useQueryClient();

  const { joinRoom, leaveRoom, on, off } = useSocket();



  const currentOrders = orders.filter(order => 
    !['DELIVERED', 'CANCELLED', 'delivered', 'cancelled'].includes(order.status)
  );
  
  const historyOrders = orders.filter(order => 
    ['DELIVERED', 'CANCELLED', 'delivered', 'cancelled'].includes(order.status)
  );

  const displayedOrders = activeTab === 'current' ? currentOrders : historyOrders;

  // Real-time status update handler
  useCustomerOrderSocket((data) => {

    setOrders((prevOrders) => 
      prevOrders.map((order) => 
        order._id === data.orderId 
          ? { ...order, status: data.status } 
          : order
      )
    );
  });

  const fetchOrders = async () => {
    try {

      setLoading(true);
      const { orders: fetchedOrders } = await getMyOrders({
        sort: '-createdAt',
        limit: 50,
      });

      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manage room subscriptions for current orders
  useEffect(() => {
    if (!customer) return;

    const currentOrderIds = currentOrders.map(o => o._id);

    
    currentOrderIds.forEach(id => {
      joinRoom(id);
    });

    // Listen for updates to any of the joined rooms
    const handleOrderUpdate = () => {

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CUSTOMER.ORDERS.ALL] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CUSTOMER.ORDERS.ACTIVE] });
    };

    on('order:update', handleOrderUpdate);

    return () => {
      currentOrderIds.forEach(id => {
        leaveRoom(id);
      });
      off('order:update', handleOrderUpdate);
    };
  }, [currentOrders.length, joinRoom, leaveRoom, customer, on, off, queryClient]); 

  useEffect(() => {
    // Only fetch orders when auth is ready and customer is authenticated
    if (!authReady || !customer) {

      setLoading(false);
      return;
    }

    fetchOrders();
  }, [authReady, customer]);

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-12">
            <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Please Login</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">You need to be logged in to view orders</p>
            <Link
              to="/customer/login"
              className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            My Orders
          </h1>

          {/* Tab Navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('current')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'current'
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Current Orders ({currentOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Order History ({historyOrders.length})
            </button>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-12 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <svg
                className="mx-auto h-16 w-16 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <p className="text-lg font-medium mb-2">
                {activeTab === 'current' ? 'No Active Orders' : 'No Order History'}
              </p>
              <p className="text-sm mb-6">
                {activeTab === 'current'
                  ? 'Start exploring our delicious menu to place your first order!'
                  : 'Your completed and cancelled orders will appear here.'}
              </p>
              {activeTab === 'current' && (
                <Link
                  to="/customer/menu"
                  className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Browse Menu
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {displayedOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              
              return (
              <div
                key={order._id}
                className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4 hover:border-indigo-500 hover:shadow-md transition-all"
              >
                {/* Order Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      #{order.orderNumber}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString()} at{' '}
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  
                  {/* Status Badge - Matches Mobile App */}
                  <div className={`${statusInfo.color} flex items-center gap-1 px-2.5 py-1 rounded-full`}>
                    <span className="text-[10px]">{statusInfo.icon}</span>
                    <span className="text-white text-[10px] font-semibold uppercase tracking-wide">{statusInfo.text}</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="mb-3">
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Items:</p>
                  <div className="space-y-1">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-[13px]">
                        <span className="text-gray-700 dark:text-gray-300">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          ₹{(item.subtotal || (item.price * item.quantity)).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Items Total</span>
                    <span className="font-semibold">₹{((order as any).pricing?.itemsTotal || 0).toFixed(0)}</span>
                  </div>
                  
                  {(order as any).pricing?.deliveryFee > 0 && (
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Delivery Fee</span>
                      <span>₹{(order as any).pricing.deliveryFee.toFixed(0)}</span>
                    </div>
                  )}
                  
                  {(order as any).pricing?.platformFee > 0 && (
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Platform Fee</span>
                      <span>₹{(order as any).pricing.platformFee.toFixed(0)}</span>
                    </div>
                  )}
                  
                  {(order as any).pricing?.packagingFee > 0 && (
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Packaging Fee</span>
                      <span>₹{(order as any).pricing.packagingFee.toFixed(0)}</span>
                    </div>
                  )}
                  
                  {(order as any).pricing?.gst > 0 && (
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>GST</span>
                      <span>₹{(order as any).pricing.gst.toFixed(0)}</span>
                    </div>
                  )}
                  
                  {(order as any).pricing?.discount > 0 && (
                    <div className="flex justify-between text-xs text-green-600 dark:text-green-400">
                      <span>Discount</span>
                      <span>-₹{(order as any).pricing.discount.toFixed(0)}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-1.5 mt-1.5"></div>
                  
                  <div className="flex justify-between text-[13px] font-bold">
                    <span className="text-gray-900 dark:text-white">Total Amount</span>
                    <span className="text-indigo-600 dark:text-indigo-400">₹{((order as any).pricing?.finalAmount || 0).toFixed(0)}</span>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex-1">
                      <p>{order.deliveryAddress.street}, {order.deliveryAddress.city}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="capitalize">{order.paymentMethod}</span>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
