import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { 
  appQueryKeys, 
  useTodayOrdersQuery,
  useAllOrdersQuery 
} from '../../../hooks/useAppDataQueries';
import { 
  updateOrderStatus, 
  bulkUpdateOrderStatus, 
} from '../../../services/order-management.service';
import { apiRequest, parseApiResponse } from '../../../config/api';
import { logger } from '../../../utils/logger';
import { useToast } from '../../../context/ToastContext';

/**
 * Orchestrates Order Management lifecycle.
 * Centralizes status updates, assignments, and view orchestration.
 */
export function useOrdersOrchestrator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  // View State
  const tab = (searchParams.get('tab') as 'today' | 'all') || 'today';
  const [currentPage, setCurrentPage] = useState(1);
  
  // Queries
  const todayQuery = useTodayOrdersQuery();
  const allOrdersQuery = useAllOrdersQuery(currentPage);
  
  // Modals & Selection State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrderIdsForAssign, setSelectedOrderIdsForAssign] = useState<string[]>([]);
  const [assigningPartner, setAssigningPartner] = useState(false);
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);

  // Fetch delivery partners when modal opens
  useEffect(() => {
    if (showAssignModal) {
      const fetchPartners = async () => {
        try {
          const response = await apiRequest('/delivery-partners');
          const result = await parseApiResponse(response);
          if (result.status === 'success' && result.data) {
            setDeliveryPartners(result.data);
          }
        } catch (error) {
          logger.error('FETCH_PARTNERS_FAILED', 'Could not load delivery partners');
        }
      };
      fetchPartners();
    }
  }, [showAssignModal]);

  // Derive active orders based on tab
  const ordersData = useMemo(() => {
    if (tab === 'today') return todayQuery.data || null;
    if (tab === 'all') return allOrdersQuery.data?.orders || null;
    return null;
  }, [tab, todayQuery.data, allOrdersQuery.data]);

  // Action: Assign Partner
  const handleAssignPartner = useCallback(async (partnerId: string) => {
    setAssigningPartner(true);
    logger.business('ORDER_ASSIGNMENT_INITIATED', 'Assigning partner to orders', { partnerId, orderCount: selectedOrderIdsForAssign.length });
    
    try {
      // API call for assignment (simplified for this refactor)
      const response = await apiRequest('/orders/assign-delivery', {
        method: 'POST',
        body: JSON.stringify({
          orderIds: selectedOrderIdsForAssign,
          partnerId
        })
      });
      
      if (response.ok) {
        showToast('Partner assigned successfully', 'success');
        setShowAssignModal(false);
        queryClient.invalidateQueries({ queryKey: appQueryKeys.todayOrders });
      } else {
        showToast('Failed to assign partner', 'error');
      }
    } catch (error) {
      showToast('Error during assignment', 'error');
    } finally {
      setAssigningPartner(false);
    }
  }, [selectedOrderIdsForAssign, showToast, queryClient]);

  const setTab = useCallback((newTab: 'today' | 'all') => {
    setSearchParams({ tab: newTab });
    logger.ui('ORDER_TAB_CHANGED', `User switched to ${newTab} tab`);
  }, [setSearchParams]);

  // Action: Update Order Status
  const handleStatusUpdate = useCallback(async (orderId: string, newStatus: string) => {
    logger.business('ORDER_STATUS_UPDATE_INITIATED', 'Updating order status', { orderId, newStatus });
    
    try {
      const success = await updateOrderStatus(orderId, newStatus);
      if (success) {
        showToast(`Order updated to ${newStatus}`, 'success');
        // Invalidate today's orders to trigger background refresh
        queryClient.invalidateQueries({ queryKey: appQueryKeys.todayOrders });
      } else {
        showToast('Failed to update order status', 'error');
      }
    } catch (error) {
      logger.error('ORDER_STATUS_UPDATE_FAILED', 'Status update error', { orderId, error });
      showToast('Error updating order', 'error');
    }
  }, [queryClient, showToast]);

  // Action: Bulk Status Update
  const handleBulkStatusUpdate = useCallback(async (orderIds: string[], status: 'ACCEPTED' | 'READY' | 'DELIVERED' | 'CANCELLED') => {
    logger.business('ORDER_BULK_UPDATE_INITIATED', 'Updating multiple orders', { count: orderIds.length, status });
    
    try {
      const result = await bulkUpdateOrderStatus(orderIds, status);
      if (result && result.modified > 0) {
        showToast(`Updated ${result.modified} order(s) to ${status}`, 'success');
        queryClient.invalidateQueries({ queryKey: appQueryKeys.todayOrders });
      } else {
        showToast('Bulk update failed or no orders were modified', 'error');
      }
    } catch (error) {
      logger.error('ORDER_BULK_UPDATE_FAILED', 'Bulk update error', { error });
      showToast('Error in bulk update', 'error');
    }
  }, [queryClient, showToast]);

  return {
    tab,
    setTab,
    currentPage,
    setCurrentPage,
    todayQuery,
    allOrdersQuery,
    ordersData,
    pagination: allOrdersQuery.data?.pagination || null,
    actions: {
      updateStatus: handleStatusUpdate,
      bulkUpdateStatus: handleBulkStatusUpdate,
      openAssignModal: (ids: string[]) => {
        setSelectedOrderIdsForAssign(ids);
        setShowAssignModal(true);
      },
    },
    modals: {
      assign: {
        isOpen: showAssignModal,
        close: () => setShowAssignModal(false),
        selectedIds: selectedOrderIdsForAssign,
        isAssigning: assigningPartner,
        partners: deliveryPartners,
        onAssign: handleAssignPartner
      }
    }
  };
}
