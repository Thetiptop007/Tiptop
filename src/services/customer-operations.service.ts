
/**
 * Customer API Service
 * Handles customer profile updates, addresses, and other customer-specific operations
 */

import { apiRequest, parseApiResponse } from '../config/api';
import { getAccessToken } from './auth-session.store';

export interface UpdateCustomerData {
  name?: {
    first: string;
    last: string;
  };
  email?: string;
  phone?: string;
}

export interface AddressData {
  type: 'home' | 'work' | 'other';
  label?: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  landmark?: string;
  isDefault?: boolean;
}

/**
 * Update customer profile
 */
export const updateCustomer = async (customerId: string, data: UpdateCustomerData) => {
  const token = getAccessToken('customer');
  
  const response = await apiRequest('/auth/me', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  return parseApiResponse(response);
};

/**
 * Create a new address for customer
 */
export const createAddress = async (address: AddressData) => {
  const token = getAccessToken('customer');
  
  const response = await apiRequest('/addresses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(address),
  });
  return parseApiResponse(response);
};

/**
 * Update an existing address
 */
export const updateAddress = async (addressId: string, address: Partial<AddressData>) => {
  const token = getAccessToken('customer');
  
  const response = await apiRequest(`/addresses/${addressId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(address),
  });
  return parseApiResponse(response);
};

/**
 * Delete an address
 */
export const deleteAddress = async (addressId: string) => {
  const token = getAccessToken('customer');
  
  const response = await apiRequest(`/addresses/${addressId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return parseApiResponse(response);
};

/**
 * Change password
 */
export const changePassword = async (data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) => {
  const token = getAccessToken('customer');
  
  const response = await apiRequest('/auth/change-password', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  return parseApiResponse(response);
};

/**
 * Get all addresses for current customer
 */
export const getAddresses = async () => {
  const token = getAccessToken('customer');
  const response = await apiRequest('/addresses', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  const parsed = await parseApiResponse(response);
  return parsed;
};

/**
 * Set an address as default
 */
export const setDefaultAddress = async (addressId: string) => {
  const token = getAccessToken('customer');
  
  const response = await apiRequest(`/addresses/${addressId}/default`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return parseApiResponse(response);
};
