import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHeader, 
  TableRow 
} from '../../../components/ui/table';
import { type Order } from '../../../services/order-management.service';
import { OrderRow } from './OrderRow';

interface OrdersTableProps {
  orders: Order[];
  title: string;
  badgeColor?: string;
  showBulkControls?: boolean;
  bulkActionLabel?: string;
  onStatusUpdate: (id: string, status: string) => void;
  onBulkUpdate?: (ids: string[]) => void;
  onAssignClick?: (id: string) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  title,
  badgeColor = 'indigo',
  showBulkControls = false,
  bulkActionLabel = 'Bulk Action',
  onStatusUpdate,
  onBulkUpdate,
  onAssignClick
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allSelected = orders.length > 0 && selectedIds.length === orders.length;

  // Sync selection when orders change
  useEffect(() => {
    setSelectedIds(prev => prev.filter(id => orders.some(o => o.id === id)));
  }, [orders]);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map(o => o.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
            {title}
          </h3>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold bg-${badgeColor}-100 text-${badgeColor}-700 dark:bg-${badgeColor}-900/30 dark:text-${badgeColor}-400`}>
            {orders.length}
          </span>
        </div>
        
        {showBulkControls && selectedIds.length > 0 && (
          <button 
            onClick={() => onBulkUpdate?.(selectedIds)}
            className="group ml-auto flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-2 text-sm font-semibold text-indigo-600 transition-all hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-200 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-600 dark:hover:text-white dark:hover:shadow-none"
          >
            <svg 
              className="h-4 w-4 transition-transform group-hover:scale-110" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{bulkActionLabel}</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white group-hover:bg-white group-hover:text-indigo-600">
              {selectedIds.length}
            </span>
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {showBulkControls && (
                  <TableCell isHeader className="px-4 py-3 text-start">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </TableCell>
                )}
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Order ID</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Customer</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Phone</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Address</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Items</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Total</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Action</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showBulkControls ? 7 : 6} className="py-12 text-center text-gray-500">
                    No orders in this status
                  </TableCell>
                </TableRow>
              ) : (
                orders.map(order => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    showBulkControls={showBulkControls}
                    isSelected={selectedIds.includes(order.id)}
                    onSelect={toggleSelect}
                    onStatusUpdate={onStatusUpdate}
                    onAssignClick={onAssignClick}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
