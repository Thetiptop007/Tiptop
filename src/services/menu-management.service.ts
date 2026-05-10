import { apiRequest, parseApiResponse } from '../config/api';
import { logger } from '../utils/logger';

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const inFlightRequests = new Map<string, Promise<unknown>>();
const responseCache = new Map<string, CacheEntry<unknown>>();

const dedupeRequest = async <T>(
  key: string,
  request: () => Promise<T>,
  ttlMs = 1500,
): Promise<T> => {
  const now = Date.now();
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const inFlight = inFlightRequests.get(key);
  if (inFlight) {
    return inFlight as Promise<T>;
  }

  const promise = request()
    .then((value) => {
      responseCache.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, promise as Promise<unknown>);
  return promise;
};

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
 * Get popular menu items (public endpoint)
 */
export const getPopularItems = async (limit: number = 3): Promise<MenuItem[]> => {
  try {
    return await dedupeRequest(`menu:popular:${limit}`, async () => {
      const response = await apiRequest(`menu/popular/items?limit=${limit}`);
      const data = await parseApiResponse(response);

      if (data.status === 'success' && data.data?.menuItems) {
        logger.network('POPULAR_ITEMS_LOADED', 'Popular menu items loaded', { count: data.data.menuItems.length });
        return data.data.menuItems.map((item: any) => ({
          id: item._id,
          name: item.name,
          description: item.description || '',
          image: item.image || item.images?.[0] || '',
          category: item.categories?.[0] || item.category || 'Other',
          categories: item.categories || [],
          price: item.priceVariants?.[0]?.price || 0,
          priceVariants: item.priceVariants || [],
          rating: item.rating || 0,
          reviews: item.reviews || 0,
          availability: item.isAvailable ? 'Available' : 'Out of Stock',
          isAvailable: item.isAvailable ?? true,
          isActive: item.isActive ?? true,
          totalOrders: item.totalOrders || 0,
          totalRevenue: item.totalRevenue || 0
        }));
      }

      return [];
    }, 15000);
  } catch (error) {
    logger.error('Error fetching popular items', { errorMessage: error instanceof Error ? error.message : String(error) });
    return [];
  }
};

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

    return await dedupeRequest(`admin:menu-items:${params.toString()}`, async () => {
      const response = await apiRequest(`admin/menu-items?${params.toString()}`, { timeoutMs: 30000 });
      const data = await parseApiResponse(response);

      if (data.status === 'success' && data.data) {
        logger.network('MENU_ITEMS_LOADED', 'Menu items loaded', { count: data.data.items?.length || 0, page, limit });
        return data.data;
      }

      return null;
    }, 1200);
  } catch (error) {
    logger.error('Error fetching menu items', { errorMessage: error instanceof Error ? error.message : String(error) });
    return null;
  }
};

/**
 * Get all categories
 */
export const getCategories = async (): Promise<string[]> => {
  try {
    return await dedupeRequest('admin:menu-categories', async () => {
      const response = await apiRequest('admin/menu-items/categories', { timeoutMs: 30000 });
      const data = await parseApiResponse(response);

      if (data.status === 'success' && data.data) {
        logger.network('MENU_CATEGORIES_LOADED', 'Menu categories loaded', { count: data.data.categories?.length || 0 });
        return data.data.categories;
      }

      return [];
    }, 30000);
  } catch (error) {
    logger.error('Error fetching categories', { errorMessage: error instanceof Error ? error.message : String(error) });
    return [];
  }
};

/**
 * Get single menu item details
 */
export const getMenuItem = async (id: string): Promise<MenuItem | null> => {
  try {
    const response = await apiRequest(`admin/menu-items/${id}`, { timeoutMs: 30000 });
    const data = await parseApiResponse(response);

    if (data.status === 'success' && data.data) {
      logger.network('MENU_ITEM_LOADED', 'Menu item loaded', { id });
      return data.data;
    }

    return null;
  } catch (error) {
    logger.error('Error fetching menu item', { errorMessage: error instanceof Error ? error.message : String(error) });
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
      timeoutMs: 30000,
    });

    const data = await parseApiResponse(response);
    return data.status === 'success';
  } catch (error) {
    logger.error('Error updating availability', { id, errorMessage: error instanceof Error ? error.message : String(error) });
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
      timeoutMs: 30000,
    });

    const data = await parseApiResponse(response);
    return data.status === 'success';
  } catch (error) {
    logger.error('Error deleting menu item', { id, errorMessage: error instanceof Error ? error.message : String(error) });
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
  isAvailable?: boolean;
}): Promise<{ success: boolean; item?: MenuItem; message?: string }> => {
  try {
    const response = await apiRequest('admin/menu-items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
      timeoutMs: 30000,
    });
    const data = await parseApiResponse(response);
    
    if (data.status === 'success') {
      logger.business('MENU_ITEM_CREATED', 'Menu item created', { hasItem: !!data.data.item });
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
    logger.error('Error creating menu item', { errorMessage: error?.message || String(error) });
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
      timeoutMs: 30000,
    });
    const data = await parseApiResponse(response);
    
    if (data.status === 'success') {
      logger.business('MENU_ITEM_UPDATED', 'Menu item updated', { id, hasItem: !!data.data.item });
      return {
        success: true,
        item: data.data.item,
        message: data.message
      };
    }
    
    // Debug: surface validation errors from backend in browser console
    logger.warn('Menu item update failed response', { id, message: data.message });

    return {
      success: false,
      message: data.message || (data.errors ? JSON.stringify(data.errors) : 'Failed to update menu item')
    };
  } catch (error: any) {
    logger.error('Error updating menu item', { id, errorMessage: error?.message || String(error) });
    return {
      success: false,
      message: error.message || 'An error occurred while updating the menu item'
    };
  }
};
