import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { logger } from '../utils/logger';

export const useCustomerOrderSocket = (onStatusUpdate: (data: any) => void) => {
  const { on, off } = useSocket();
  const { showToast } = useToast();

  useEffect(() => {
    const handleStatusUpdate = (data: any) => {
      logger.business('ORDER_STATUS_UPDATE_RECEIVED', 'Customer order status updated via socket', data);
      
      // Notify customer
      showToast(`📦 Order #${data.orderNumber || 'Update'}: Status is now ${data.status}`, 'info', 5000);
      
      // Callback to update local state
      onStatusUpdate(data);
    };

    on('order:status-update', handleStatusUpdate);

    return () => {
      off('order:status-update', handleStatusUpdate);
    };
  }, [on, off, showToast, onStatusUpdate]);
};
