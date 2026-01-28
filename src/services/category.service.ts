import { apiRequest, parseApiResponse } from '../config/api';

export interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  itemCount: number;
  color: 'green' | 'red' | 'blue' | 'purple' | 'orange' | 'pink' | 'yellow';
  createdAt: string;
  updatedAt: string;
}

export interface CategoriesResponse {
  status: string;
  results: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: {
    categories: Category[];
  };
}

export interface CategoryResponse {
  status: string;
  data: {
    category: Category;
  };
}

export const getCategories = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  _t?: number; // Cache busting parameter
}): Promise<CategoriesResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?._t) queryParams.append('_t', params._t.toString());
  
  const url = `/categories${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const response = await apiRequest(url, {
    method: 'GET',
    cache: 'no-cache', // Prevent browser caching
  });

  const parsedResponse = await parseApiResponse(response) as any;
  console.log('Category API Response:', parsedResponse);
  console.log('Categories in response:', parsedResponse?.data?.categories?.length);
  
  return {
    status: parsedResponse.status,
    results: parsedResponse.results || 0,
    pagination: parsedResponse.pagination || { page: 1, limit: 10, total: 0, pages: 1 },
    data: {
      categories: parsedResponse.data?.categories || []
    }
  };
};

export const getCategoryById = async (id: string): Promise<Category> => {
  const response = await apiRequest(`/categories/${id}`, {
    method: 'GET',
  });

  const parsedResponse = await parseApiResponse(response) as any;
  return parsedResponse.data.category;
};

export const createCategory = async (data: {
  name: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}): Promise<Category> => {
  const response = await apiRequest('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  const parsedResponse = await parseApiResponse(response) as any;
  return parsedResponse.data.category;
};

export const updateCategory = async (
  id: string,
  data: Partial<Category>
): Promise<Category> => {
  const response = await apiRequest(`/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  const parsedResponse = await parseApiResponse(response) as any;
  return parsedResponse.data.category;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const response = await apiRequest(`/categories/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete category');
  }
};

export const toggleCategoryStatus = async (id: string): Promise<Category> => {
  const response = await apiRequest(`/categories/${id}/toggle-status`, {
    method: 'PATCH',
  });

  const parsedResponse = await parseApiResponse(response) as any;
  return parsedResponse.data.category;
};
