import { useState, useEffect } from 'react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { updateCustomer, changePassword as apiChangePassword } from '../services/customer-operations.service';
import { useToast } from '../context/ToastContext';

export function useProfileOrchestrator() {
  const { customer, refreshProfile, logout } = useCustomerAuth();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (customer) {
      const name = customer.name;
      if (typeof name === 'string') {
        const parts = name.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      } else if (name && typeof name === 'object') {
        setFirstName(name.first || '');
        setLastName(name.last || '');
      }
    }
  }, [customer]);

  const updateProfile = async () => {
    if (!firstName.trim()) return showToast('First name is required', 'error');
    
    setSaving(true);
    try {
      await updateCustomer({
        name: { first: firstName.trim(), last: lastName.trim() }
      });
      await refreshProfile();
      showToast('Profile updated successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (data: any) => {
    setSaving(true);
    try {
      await apiChangePassword(data);
      showToast('Password changed. Please login again.', 'success');
      setTimeout(() => logout(), 2000);
    } catch (error: any) {
      showToast(error.message || 'Failed to change password', 'error');
    } finally {
      setSaving(false);
    }
  };

  return {
    profile: {
      firstName: { value: firstName, set: setFirstName },
      lastName: { value: lastName, set: setLastName },
      email: typeof customer?.email === 'string' ? customer.email : (customer?.email?.address || ''),
      phone: typeof customer?.phone === 'string' ? customer.phone : (customer?.phone?.number || '')
    },
    status: { saving },
    actions: { updateProfile, changePassword }
  };
}
