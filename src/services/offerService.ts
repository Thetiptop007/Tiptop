import { getApiUrl } from '../config/api';

export interface Offer {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  offerType: 'single_day' | 'multi_day' | 'recurring';
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountCap: number | null;
  applicableTo: 'all' | 'categories' | 'items';
  applicableCategories: string[];
  applicableItems: string[];
  teaserEnabled: boolean;
  teaserStartDate?: string;
  teaserMessage?: string;
  bannerImage?: string | null;
  status: 'draft' | 'scheduled' | 'active' | 'ended' | 'deactivated';
  isTeaser?: boolean;
  isActive?: boolean;
}

export interface ApplicableOffer extends Offer {
  calculatedDiscount: number;
}

export interface CheckOffersRequest {
  items: Array<{
    itemId: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
}

export interface CheckOffersResponse {
  success: boolean;
  message?: string;
  data: ApplicableOffer[];
}

// Get active offers (for display on menu)
export const getActiveOffers = async (): Promise<Offer[]> => {
  try {
    const response = await fetch(getApiUrl('/offers/active'));
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch active offers');
    }
    
    return data.data || [];
  } catch (error) {
    console.error('Error fetching active offers:', error);
    return [];
  }
};

// Get teaser offers (for upcoming promotions)
export const getTeaserOffers = async (): Promise<Offer[]> => {
  try {
    const response = await fetch(getApiUrl('/offers/teasers'));
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch teaser offers');
    }
    
    return data.data || [];
  } catch (error) {
    console.error('Error fetching teaser offers:', error);
    return [];
  }
};

// Check applicable offers for cart items
export const checkApplicableOffers = async (
  cartData: CheckOffersRequest
): Promise<ApplicableOffer[]> => {
  try {
    const response = await fetch(getApiUrl('/offers/check'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cartData),
    });
    
    const data: CheckOffersResponse = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to check applicable offers');
    }
    
    return data.data || [];
  } catch (error) {
    console.error('Error checking applicable offers:', error);
    return [];
  }
};
