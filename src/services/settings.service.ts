import { apiRequest, parseApiResponse } from '../config/api';

export interface AdminProfile {
  firstName: string;
  lastName: string;
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
