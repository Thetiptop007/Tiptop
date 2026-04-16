import { apiRequest, parseApiResponse } from '../config/api';

export interface TrendPoint {
  label: string;
  revenue: number;
  orders: number;
}

export interface BusinessInsightsData {
  summary: {
    todayRevenue: number;
    todayOrders: number;
    todayAvgOrderValue: number;
    totalAvgOrderValue: number;
    changes: {
      todayRevenuePct: number;
      todayOrdersPct: number;
    };
  };
  trends: {
    yearly: TrendPoint[];
    monthlyByYear: Record<string, TrendPoint[]>;
  };
}

export const getBusinessInsightsData = async (): Promise<BusinessInsightsData | null> => {
  const response = await apiRequest('dashboard/business-insights');
  const parsed = await parseApiResponse(response);

  if (response.status === 401) {
    throw new Error(parsed.message || 'Session expired. Please sign in again.');
  }

  if (!response.ok) {
    throw new Error(parsed.message || 'Failed to load business insights.');
  }

  if (parsed.status === 'success' && parsed.data) {
    return parsed.data as BusinessInsightsData;
  }

  throw new Error(parsed.message || 'Failed to load business insights.');
};
