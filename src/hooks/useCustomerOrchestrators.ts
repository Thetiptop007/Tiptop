import { useState, useCallback } from 'react';
import { useAddressesQuery, useAddressMutations } from './useAppDataQueries';
import { useToast } from '../context/ToastContext';
import { logger } from '../utils/logger';
import { AddressData } from '../services/customer-operations.service';

/**
 * Orchestrates address management lifecycle.
 */
export function useAddressOrchestrator() {
  const { showToast } = useToast();
  const addressesQuery = useAddressesQuery();
  const mutations = useAddressMutations();

  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  const handleSave = useCallback(async (data: AddressData) => {
    try {
      if (editingAddress) {
        await mutations.updateAddress.mutateAsync({ id: editingAddress._id, data });
        showToast('Address updated successfully', 'success');
      } else {
        await mutations.createAddress.mutateAsync(data);
        showToast('Address saved successfully', 'success');
      }
      setShowForm(false);
      setEditingAddress(null);
    } catch (error: any) {
      logger.error('SAVE_ADDRESS_FAILED', error.message);
      showToast(error.message || 'Failed to save address', 'error');
    }
  }, [editingAddress, mutations, showToast]);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await mutations.deleteAddress.mutateAsync(id);
      showToast('Address deleted', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to delete address', 'error');
    }
  }, [mutations, showToast]);

  return {
    query: addressesQuery,
    form: {
      isOpen: showForm,
      editing: editingAddress,
      open: (addr?: any) => {
        setEditingAddress(addr || null);
        setShowForm(true);
      },
      close: () => {
        setShowForm(false);
        setEditingAddress(null);
      }
    },
    actions: {
      save: handleSave,
      delete: handleDelete,
      setDefault: async (id: string) => {
        // Implementation for setting default...
      }
    }
  };
}
