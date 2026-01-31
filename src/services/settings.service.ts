import { apiRequest, parseApiResponse } from '../config/api';

export interface AdminProfile {
  firstName: string;
  lastName: string;
}

export interface ShopStatus {
  isOpen: boolean;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  closureReason: string;
}

export interface Settings {
  _id?: string;
  siteName: string;
  contactEmail: string;
  contactPhone: string;
  businessAddress: string;
  website: string;
  notificationEmails: string[];
  minimumOrderAmount: number;
  taxRate: number;
  deliveryCharge: number;
  discountAmount: number;
  appUpdateAvailable: boolean;
  appUpdateMessage: string;
  appUpdateUrl: string;
  upiId: string;
  apkDownloadUrl: string;
  indusAppStoreUrl: string;
  adminProfile: AdminProfile;
  shopStatus?: ShopStatus;
}

export interface SettingsResponse {
  success: boolean;
  message?: string;
  data: {
    settings: Settings;
  };
}

export const getSettings = async (): Promise<Settings> => {
  const response = await apiRequest('/settings', {
    method: 'GET',
  });

  const parsedResponse = await parseApiResponse<{ settings: Settings }>(response);
  
  if (parsedResponse.status === 'error' || !parsedResponse.data) {
    throw new Error(parsedResponse.message || 'Failed to fetch settings');
  }
  
  return parsedResponse.data.settings;
};

export const updateSettings = async (settings: Partial<Settings>): Promise<Settings> => {
  const response = await apiRequest('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });

  const parsedResponse = await parseApiResponse<{ settings: Settings }>(response);
  
  if (parsedResponse.status === 'error' || !parsedResponse.data) {
    throw new Error(parsedResponse.message || 'Failed to update settings');
  }
  
  return parsedResponse.data.settings;
};

export const toggleShopStatus = async (isOpen: boolean, closureReason?: string): Promise<ShopStatus> => {
  const response = await apiRequest('/settings/shop-status', {
    method: 'PATCH',
    body: JSON.stringify({ isOpen, closureReason }),
  });

  const parsedResponse = await parseApiResponse<{ shopStatus: ShopStatus }>(response);
  
  if (parsedResponse.status === 'error' || !parsedResponse.data) {
    throw new Error(parsedResponse.message || 'Failed to update shop status');
  }
  
  return parsedResponse.data.shopStatus;
};

export const getShopStatus = async (): Promise<ShopStatus> => {
  const response = await apiRequest('/settings/shop-status', {
    method: 'GET',
  });

  const parsedResponse = await parseApiResponse<{ shopStatus: ShopStatus }>(response);
  
  if (parsedResponse.status === 'error' || !parsedResponse.data) {
    throw new Error(parsedResponse.message || 'Failed to fetch shop status');
  }
  
  return parsedResponse.data.shopStatus;
};
