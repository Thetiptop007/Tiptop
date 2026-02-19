
/**
 * Customer API Service
 * Handles customer profile updates, addresses, and other customer-specific operations
 */

import { apiRequest, parseApiResponse } from '../config/api';

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
  const token = localStorage.getItem('customerToken');
  
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
  const token = localStorage.getItem('customerToken');
  
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
  const token = localStorage.getItem('customerToken');
  
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
  const token = localStorage.getItem('customerToken');
  
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
  const token = localStorage.getItem('customerToken');
  
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
  console.log('📍 [getAddresses] Starting...');
  const token = localStorage.getItem('customerToken');
  console.log('📍 [getAddresses] Customer token:', token ? `${token.substring(0, 20)}...` : 'null');
  
  console.log('📍 [getAddresses] Calling apiRequest...');
  const response = await apiRequest('/addresses', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  console.log('📍 [getAddresses] apiRequest completed, response:', response);
  
  console.log('📍 [getAddresses] Parsing response...');
  const parsed = await parseApiResponse(response);
  console.log('📍 [getAddresses] Parsed response:', parsed);
  return parsed;
};

/**
 * Set an address as default
 */
export const setDefaultAddress = async (addressId: string) => {
  const token = localStorage.getItem('customerToken');
  
  const response = await apiRequest(`/addresses/${addressId}/default`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return parseApiResponse(response);
};
