import { apiRequest, parseApiResponse } from '../config/api';
import { logger } from '../utils/logger';

export interface Address {
  _id?: string;
  type: 'home' | 'work' | 'other';
  label?: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  landmark?: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface Customer {
  _id: string;
  email: string | { address: string; isVerified: boolean };
  phone: string | { number: string; isVerified: boolean };
  name: string | { first: string; last: string };
  avatar?: string;
  role: string;
  addresses: Address[];
  customerData: {
    loyaltyPoints: number;
    totalOrders: number;
    totalSpent: number;
  };
  isActive: boolean;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomersResponse {
  status: string;
  results: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
  data: {
    users: Customer[];
  };
}

export interface CustomerResponse {
  status: string;
  data: {
    user: Customer;
  };
}

export const getCustomers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  sort?: string;
}): Promise<CustomersResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.sort) queryParams.append('sort', params.sort);
  
  const rolePath = params?.role ? `/users/role/${params.role}` : '/users';
  const url = `${rolePath}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  logger.debug('Fetching customers', {
    page: params?.page,
    limit: params?.limit,
    hasSearch: !!params?.search,
    sort: params?.sort,
  });
  
  const response = await apiRequest(url, {
    method: 'GET',
    timeoutMs: 30000,
  });

  const parsedResponse = await parseApiResponse(response) as any;
  
  // parsedResponse structure: { status, results, pagination, data: { users } }
  // results and pagination are at top level, users are in data
  
  const finalResponse = {
    status: parsedResponse.status,
    results: parsedResponse.results || 0,
    pagination: {
      page: parsedResponse.pagination?.currentPage || parsedResponse.pagination?.page || 1,
      limit: parsedResponse.pagination?.itemsPerPage || parsedResponse.pagination?.limit || 10,
      totalPages: parsedResponse.pagination?.totalPages || 1,
      totalResults: parsedResponse.pagination?.totalItems || parsedResponse.pagination?.totalResults || 0
    },
    data: {
      users: parsedResponse.data?.users || []
    }
  };
  
  return finalResponse;
};

export const getCustomerById = async (id: string): Promise<Customer> => {
  const response = await apiRequest(`/users/${id}`, {
    method: 'GET',
    timeoutMs: 30000,
  });

  const parsedResponse = await parseApiResponse(response);
  return parsedResponse.data.user;
};

export const updateCustomer = async (id: string, data: Partial<Customer>): Promise<Customer> => {
  const response = await apiRequest(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    timeoutMs: 30000,
  });

  const parsedResponse = await parseApiResponse(response);
  return parsedResponse.data.user;
};

export const deleteCustomer = async (id: string): Promise<void> => {
  await apiRequest(`/users/${id}`, {
    method: 'DELETE',
    timeoutMs: 30000,
  });
};

export const toggleBlockCustomer = async (
  id: string,
  isBlocked: boolean,
  blockReason?: string
): Promise<Customer> => {
  const response = await apiRequest(`/users/${id}/block`, {
    method: 'PATCH',
    body: JSON.stringify({ isBlocked, blockReason }),
    timeoutMs: 30000,
  });

  const parsedResponse = await parseApiResponse(response);
  return parsedResponse.data.user;
};
