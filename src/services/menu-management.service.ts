import { apiRequest, parseApiResponse } from '../config/api';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  categories: string[];
  price: number;
  priceVariants: Array<{
    quantity: string;
    price: number;
  }>;
  rating: number;
  reviews: number;
  availability: 'Available' | 'Out of Stock';
  isAvailable: boolean;
  isActive: boolean;
  totalOrders?: number;
  totalRevenue?: number;
}

export interface MenuItemsResponse {
  items: MenuItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CategoriesResponse {
  categories: string[];
  count: number;
}

/**
 * Get menu items with filters, search, and pagination
 */
export const getMenuItems = async (
  page: number = 1,
  limit: number = 12,
  category?: string,
  search?: string
): Promise<MenuItemsResponse | null> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (category && category !== 'all') {
      params.append('category', category);
    }

    if (search && search.trim() !== '') {
      params.append('search', search.trim());
    }

    const response = await apiRequest(`admin/menu-items?${params.toString()}`);
    const data = await parseApiResponse(response);

    if (data.status === 'success' && data.data) {
      return data.data;
    }

    return null;
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return null;
  }
};

/**
 * Get all categories
 */
export const getCategories = async (): Promise<string[]> => {
  try {
    const response = await apiRequest('admin/menu-items/categories');
    const data = await parseApiResponse(response);

    if (data.status === 'success' && data.data) {
      return data.data.categories;
    }

    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

/**
 * Get single menu item details
 */
export const getMenuItem = async (id: string): Promise<MenuItem | null> => {
  try {
    const response = await apiRequest(`admin/menu-items/${id}`);
    const data = await parseApiResponse(response);

    if (data.status === 'success' && data.data) {
      return data.data;
    }

    return null;
  } catch (error) {
    console.error('Error fetching menu item:', error);
    return null;
  }
};

/**
 * Update menu item availability
 */
export const updateAvailability = async (
  id: string,
  isAvailable: boolean
): Promise<boolean> => {
  try {
    const response = await apiRequest(`admin/menu-items/${id}/availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isAvailable }),
    });

    const data = await parseApiResponse(response);
    return data.status === 'success';
  } catch (error) {
    console.error('Error updating availability:', error);
    return false;
  }
};

/**
 * Delete menu item
 */
export const deleteMenuItem = async (id: string): Promise<boolean> => {
  try {
    const response = await apiRequest(`admin/menu-items/${id}`, {
      method: 'DELETE',
    });

    const data = await parseApiResponse(response);
    return data.status === 'success';
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return false;
  }
};

/**
 * Create new menu item
 */
export const createMenuItem = async (itemData: {
  name: string;
  description: string;
  image: string;
  priceVariants: Array<{ quantity: string; price: number }>;
  category: string; // Changed from categories to category (singular)
  preparationTime?: number;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isAvailable?: boolean;
}): Promise<{ success: boolean; item?: MenuItem; message?: string }> => {
  try {
    const response = await apiRequest('admin/menu-items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });
    const data = await parseApiResponse(response);
    
    if (data.status === 'success') {
      return {
        success: true,
        item: data.data.item,
        message: data.message
      };
    }
    
    return {
      success: false,
      message: data.message || 'Failed to create menu item'
    };
  } catch (error: any) {
    console.error('Error creating menu item:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while creating the menu item'
    };
  }
};

/**
 * Update menu item
 */
export const updateMenuItem = async (
  id: string,
  itemData: Partial<{
    name: string;
    description: string;
    image: string;
    priceVariants: Array<{ quantity: string; price: number }>;
    category: string; // Changed from categories to category (singular)
    preparationTime: number;
    isVegetarian: boolean;
    isSpicy: boolean;
    isAvailable: boolean;
    isActive: boolean;
  }>
): Promise<{ success: boolean; item?: MenuItem; message?: string }> => {
  try {
    const response = await apiRequest(`admin/menu-items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });
    const data = await parseApiResponse(response);
    
    if (data.status === 'success') {
      return {
        success: true,
        item: data.data.item,
        message: data.message
      };
    }
    
    return {
      success: false,
      message: data.message || 'Failed to update menu item'
    };
  } catch (error: any) {
    console.error('Error updating menu item:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while updating the menu item'
    };
  }
};
