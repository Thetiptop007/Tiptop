import React, { useState } from 'react';
import { TableRow, TableCell } from '../../../components/ui/table';
import { type Order, getOrderDetails } from '../../../services/order-management.service';
import { printOrderReceipt } from '../utils/order-print';
import { logger } from '../../../utils/logger';
import { formatOrderNumberForDisplay } from '../../../utils/orderNumber';

interface OrderRowProps {
  order: Order;
  showBulkControls?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onStatusUpdate: (id: string, status: string) => void;
  onAssignClick?: (id: string) => void;
}

export const OrderRow: React.FC<OrderRowProps> = ({
  order,
  showBulkControls,
  isSelected,
  onSelect,
  onStatusUpdate,
  onAssignClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [details, setDetails] = useState<Order | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const toggleExpand = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    setIsExpanded(true);
    // If we don't have full details (items), fetch them
    if (!order.items || order.items.length === 0) {
      setLoadingDetails(true);
      try {
        const fullDetails = await getOrderDetails(order.id);
        setDetails(fullDetails);
      } catch (error) {
        logger.error('FETCH_ORDER_DETAILS_FAILED', 'Could not expand order', { orderId: order.id });
      } finally {
        setLoadingDetails(false);
      }
    }
  };

  const handlePrint = async (e: React.MouseEvent) => {
    e.stopPropagation();
    let printDetails = details || order;
    
    // If we still don't have items, we must fetch before printing
    if (!printDetails.items || printDetails.items.length === 0) {
      const freshDetails = await getOrderDetails(order.id);
      printDetails = freshDetails || printDetails;
      setDetails(freshDetails);
    }
    
    printOrderReceipt(order, printDetails);
  };

  const getCustomerSourceMeta = (type: string) => {
    const upperType = type?.toUpperCase();
    switch (upperType) {
      case 'WEBSITE':
      case 'APP':
      case 'LOGGED_IN':
        return { label: 'Logged in', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
      case 'POS':
      case 'ADMIN':
        return { label: 'Admin created', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' };
      case 'GUEST':
        return { label: 'Guest', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
      default:
        return { label: 'Guest', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
    }
  };

  const handleAcceptAndPrint = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // 1. Trigger status update
    onStatusUpdate(order.id, 'ACCEPTED');
    // 2. Trigger print
    handlePrint(e);
  };

  const getActionButton = () => {
    const status = order.status.toUpperCase();
    
    if (status === 'PENDING' || status === 'NEW') {
      return (
        <button 
          onClick={handleAcceptAndPrint}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 transition-colors"
        >
          Accept & Print
        </button>
      );
    }

    if (status === 'ACCEPTED') {
      return (
        <button 
          onClick={(e) => { e.stopPropagation(); onStatusUpdate(order.id, order.orderType === 'TAKEAWAY' ? 'READY_FOR_PICKUP' : 'READY'); }}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 transition-colors"
        >
          Mark Ready
        </button>
      );
    }

    if (status === 'READY' && order.orderType !== 'TAKEAWAY') {
      return (
        <button 
          onClick={(e) => { e.stopPropagation(); onAssignClick?.(order.id); }}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 transition-colors"
        >
          Assign
        </button>
      );
    }

    if (status === 'READY_FOR_PICKUP' || status === 'OUT_FOR_DELIVERY') {
      return (
        <button 
          onClick={(e) => { e.stopPropagation(); onStatusUpdate(order.id, 'DELIVERED'); }}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 transition-colors"
        >
          Delivered
        </button>
      );
    }

    return <span className="text-xs font-medium text-gray-500 px-2 py-1 bg-gray-50 dark:bg-gray-900/10 rounded">{order.status}</span>;
  };

  return (
    <>
      <TableRow className="hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer" onClick={toggleExpand}>
        {showBulkControls && (
          <TableCell className="px-4 py-3 text-start" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect?.(order.id)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </TableCell>
        )}
        <TableCell className="px-5 py-4 sm:px-6 text-start">
          <div className="flex items-center gap-2">
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9 5l7 7-7 7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {formatOrderNumberForDisplay(order.orderId)}
            </span>
          </div>
        </TableCell>
        <TableCell className="px-4 py-3 text-start">
          <div className="text-gray-800 text-theme-sm dark:text-white/90">{order.customer}</div>
          <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${getCustomerSourceMeta(order.customerType || 'WALK_IN').className}`}>
            {getCustomerSourceMeta(order.customerType || 'WALK_IN').label}
          </span>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{order.phone}</TableCell>
        <TableCell className="px-4 py-3 text-start">
          {order.address && (order.address.area || order.address.addressLine) ? (
            <>
              <div className="text-gray-800 text-theme-sm dark:text-white/90">
                {order.address.addressLine}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {order.address.area}
              </div>
            </>
          ) : order.orderType === 'TAKEAWAY' ? (
            <span className="text-gray-500 text-xs">Takeaway</span>
          ) : (
            <span className="text-gray-400 text-xs">-</span>
          )}
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {order.items?.length || order.itemCount || 0} items
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">{order.total}</TableCell>
        <TableCell className="px-4 py-3 text-start">
          <div className="flex items-center gap-2">
            {getActionButton()}
            {order.status.toUpperCase() !== 'PENDING' && order.status.toUpperCase() !== 'NEW' && (
              <button 
                onClick={handlePrint} 
                className="px-2 py-1.5 text-xs font-medium rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 transition-colors flex items-center justify-center"
                title="Print Receipt"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeWidth={2} />
                </svg>
              </button>
            )}
          </div>
        </TableCell>
      </TableRow>
      
      {isExpanded && (
        <TableRow className="bg-gray-50 dark:bg-white/[0.02]">
          <TableCell colSpan={showBulkControls ? 8 : 7} className="px-5 py-4">
            {loadingDetails ? (
              <div className="flex justify-center items-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Order Details */}
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white/90 text-sm mb-2">
                        Order Details
                      </h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p><span className="font-medium text-gray-700 dark:text-gray-300">Order ID:</span> {formatOrderNumberForDisplay(order.orderId)}</p>
                        <p><span className="font-medium text-gray-700 dark:text-gray-300">Date:</span> {order.date || new Date().toLocaleDateString('en-CA')}</p>
                        <p><span className="font-medium text-gray-700 dark:text-gray-300">Time:</span> {order.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}</p>
                        <p>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Order Source:</span>{' '}
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getCustomerSourceMeta(order.customerType || 'WALK_IN').className}`}>
                            {getCustomerSourceMeta(order.customerType || 'WALK_IN').label}
                          </span>
                        </p>
                        <p><span className="font-medium text-gray-700 dark:text-gray-300">Total Amount:</span> {order.total}</p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white/90 text-sm mb-2">
                        Customer Information
                      </h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p><span className="font-medium text-gray-700 dark:text-gray-300">Name:</span> {order.customer}</p>
                        <p><span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span> {order.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Delivery Address */}
                    {order.address && (
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-white/90 text-sm mb-2">
                          Delivery Address
                        </h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <p><span className="font-medium text-gray-700 dark:text-gray-300">Address:</span> {order.address.addressLine}</p>
                          <p><span className="font-medium text-gray-700 dark:text-gray-300">Area:</span> {order.address.area}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Cancel Order Button */}
                    {order.status.toUpperCase() !== 'DELIVERED' && order.status.toUpperCase() !== 'CANCELLED' && (
                      <div className="pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to cancel order ${formatOrderNumberForDisplay(order.orderId)}?`)) {
                              onStatusUpdate(order.id, 'CANCELLED');
                            }
                          }}
                          className="px-4 py-2 text-sm font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel Order
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white/90 text-sm mb-2">
                    Order Items ({(details?.items || order.items || []).reduce((sum, item) => sum + item.quantity, 0)} items)
                  </h4>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100 dark:bg-white/[0.03]">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Item</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Portion</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">No. of Items</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {(details?.items || order.items || []).map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-800 dark:text-white/90">{item.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{item.portion || '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-800 dark:text-white/90 text-right">{item.price}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-100 dark:bg-white/[0.03]">
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 text-right font-medium">Items Total:</td>
                          <td className="px-4 py-2 text-sm text-gray-800 dark:text-white/90 text-right">₹{(details?.items || order.items || []).reduce((sum, item) => sum + (parseFloat(item.price.toString().replace('₹', '')) * item.quantity), 0).toFixed(2)}</td>
                        </tr>
                        <tr className="border-t border-gray-200 dark:border-gray-600">
                          <td colSpan={3} className="px-4 py-2 text-sm text-gray-800 dark:text-white/90 text-right font-bold">Total:</td>
                          <td className="px-4 py-2 text-sm text-gray-800 dark:text-white/90 text-right font-bold">{order.total}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
};
