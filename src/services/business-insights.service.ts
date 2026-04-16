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
  try {
    const response = await apiRequest('dashboard/business-insights');
    const parsed = await parseApiResponse(response);

    if (parsed.status === 'success' && parsed.data) {
      return parsed.data as BusinessInsightsData;
    }

    return null;
  } catch (error) {
    console.error('Error fetching business insights data:', error);
    return null;
  }
};
