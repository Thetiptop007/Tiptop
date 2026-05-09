import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { appQueryKeys } from './useAppDataQueries';
import { logger } from '../utils/logger';

// Path for new order sound
const NEW_ORDER_SOUND = '/sounds/new-order.mp3';

export const useAdminOrderSocket = () => {
  const { on, off } = useSocket();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio(NEW_ORDER_SOUND);
      audio.play().catch(err => logger.warn('[SOCKET] Could not play sound:', { error: err }));
    } catch (error) {
      logger.error('[SOCKET] Sound error:', { error });
    }
  }, []);

  useEffect(() => {
    // 1. Handle New Order
    const handleNewOrder = (data: any) => {
      logger.business('NEW_ORDER_RECEIVED', 'Real-time order received via socket', data);
      
      // Invalidate the main orders query to fetch the new list
      queryClient.invalidateQueries({ queryKey: appQueryKeys.todayOrders });
      
      // Notify Admin
      playNotificationSound();
      showToast(`🔔 New Order Received: #${data.orderNumber || (typeof data._id === 'string' ? data._id.slice(-6) : 'New')}`, 'success', 5000);
    };

    // 2. Handle Order Update (Status changed by kitchen or delivery)
    const handleOrderUpdate = (data: any) => {
      logger.business('ORDER_UPDATE_RECEIVED', 'Real-time order update received via socket', data);
      
      // Patch the cache instead of full invalidation for smoother UI
      queryClient.invalidateQueries({ queryKey: appQueryKeys.todayOrders });
      
      // If we are on a specific order details page, we could patch that too
      if (data.orderId) {
        queryClient.invalidateQueries({ queryKey: ['order', data.orderId] });
      }
    };
    on('order:new', handleNewOrder);
    on('order:update', handleOrderUpdate);

    return () => {
      off('order:new', handleNewOrder);
      off('order:update', handleOrderUpdate);
    };
  }, [on, off, queryClient, playNotificationSound, showToast]);
};
