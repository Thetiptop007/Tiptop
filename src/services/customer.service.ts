import { apiRequest, parseApiResponse } from '../config/api';

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
}): Promise<CustomersResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.role) queryParams.append('role', params.role);
  
  const url = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  console.log('🔵 [CUSTOMER SERVICE] Making request:', {
    url,
    params,
    queryString: queryParams.toString()
  });
  
  const response = await apiRequest(url, {
    method: 'GET',
  });

  console.log('🔵 [CUSTOMER SERVICE] Raw response status:', response.status);
  
  const parsedResponse = await parseApiResponse(response) as any;
  
  console.log('🔵 [CUSTOMER SERVICE] Parsed Response:', JSON.stringify(parsedResponse, null, 2));
  console.log('🔵 [CUSTOMER SERVICE] Response keys:', Object.keys(parsedResponse));
  console.log('🔵 [CUSTOMER SERVICE] parsedResponse.status:', parsedResponse.status);
  console.log('🔵 [CUSTOMER SERVICE] parsedResponse.results:', parsedResponse.results);
  console.log('🔵 [CUSTOMER SERVICE] parsedResponse.pagination:', parsedResponse.pagination);
  console.log('🔵 [CUSTOMER SERVICE] parsedResponse.data:', parsedResponse.data);
  
  if (parsedResponse.data && parsedResponse.data.users) {
    console.log('🔵 [CUSTOMER SERVICE] Users count:', parsedResponse.data.users.length);
    console.log('🔵 [CUSTOMER SERVICE] First user sample:', parsedResponse.data.users[0]);
  } else {
    console.log('❌ [CUSTOMER SERVICE] No users in response data!');
  }
  
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
  
  console.log('🔵 [CUSTOMER SERVICE] Final response being returned:', {
    status: finalResponse.status,
    results: finalResponse.results,
    pagination: finalResponse.pagination,
    usersCount: finalResponse.data.users.length
  });
  
  return finalResponse;
};

export const getCustomerById = async (id: string): Promise<Customer> => {
  const response = await apiRequest(`/users/${id}`, {
    method: 'GET',
  });

  const parsedResponse = await parseApiResponse(response);
  return parsedResponse.data.user;
};

export const updateCustomer = async (id: string, data: Partial<Customer>): Promise<Customer> => {
  const response = await apiRequest(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  const parsedResponse = await parseApiResponse(response);
  return parsedResponse.data.user;
};

export const deleteCustomer = async (id: string): Promise<void> => {
  await apiRequest(`/users/${id}`, {
    method: 'DELETE',
  });
};

export const toggleBlockCustomer = async (id: string): Promise<Customer> => {
  const response = await apiRequest(`/users/${id}/block`, {
    method: 'PATCH',
  });

  const parsedResponse = await parseApiResponse(response);
  return parsedResponse.data.user;
};
