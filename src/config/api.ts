/**
 * Get the API base URL from environment variables
 * Falls back to localhost if not set
 */
export const getApiUrl = (endpoint: string = ''): string => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Combine base URL and endpoint
  return cleanEndpoint ? `${baseUrl}/${cleanEndpoint}` : baseUrl;
};

/**
 * Make an authenticated API request
 */
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const fullUrl = getApiUrl(endpoint);
  
  // Check if online before making request
  if (!navigator.onLine) {
    throw new Error('No internet connection. Please check your network and try again.');
  }
  
  // Add cache-busting timestamp to URL
  const cacheBuster = `_t=${Date.now()}`;
  const separator = fullUrl.includes('?') ? '&' : '?';
  const finalUrl = `${fullUrl}${separator}${cacheBuster}`;
  
  console.log('🚀 [apiRequest] Starting request:', {
    endpoint,
    finalUrl,
    method: options.method || 'GET',
    timestamp: new Date().toISOString()
  });
  
  // Check if this is a customer authentication endpoint (should not include admin token)
  // This includes auth endpoints and customer-specific user endpoints
  const isCustomerAuthEndpoint = endpoint.match(/^auth\/(login|register|verify-otp|resend-otp)$/);
  const isCustomerAddressEndpoint = endpoint.match(/^\/addresses/);
  
  // Check if Authorization header is explicitly provided in options
  const hasExplicitAuth = options.headers && 'Authorization' in options.headers;
  
  const token = localStorage.getItem('adminToken');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  // Only add admin token if:
  // 1. Token exists
  // 2. NOT a customer auth endpoint (login/register/verify-otp/resend-otp)
  // 3. NOT a customer address endpoint (/addresses)
  // 4. Authorization header not already explicitly set in options
  if (token && !isCustomerAuthEndpoint && !isCustomerAddressEndpoint && !hasExplicitAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  console.log('📤 [apiRequest] Request headers:', headers);
  
  try {
    const response = await fetch(finalUrl, {
      ...options,
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000), // 10 second timeout for debugging
    });
    
    console.log('📥 [apiRequest] Response received:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    // Log 401 responses but don't automatically clear tokens
    // Let individual components/contexts handle authentication errors appropriately
    if (response.status === 401) {
      const currentPath = window.location.pathname;
      const isAdminRoute = currentPath.startsWith('/admin');
      const isCustomerRoute = currentPath.startsWith('/customer');
      
      console.log('⚠️ [apiRequest] 401 Unauthorized response', {
        currentPath,
        isAdminRoute,
        isCustomerRoute,
        endpoint: finalUrl,
        note: 'Not auto-clearing tokens - let components handle this'
      });
      
      // Only auto-clear and redirect for admin routes (stricter security)
      if (isAdminRoute) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminName');
        localStorage.removeItem('adminRole');
        window.location.href = '/signin';
      }
      // For customer routes, don't auto-clear tokens
      // Components/contexts will handle token clearing when appropriate
    }
    
    return response;
  } catch (error: any) {
    console.error('❌ [apiRequest] Error caught:', error);
    console.error('❌ [apiRequest] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Handle network errors with user-friendly messages
    if (error.name === 'TimeoutError') {
      console.error('❌ [apiRequest] TimeoutError detected');
      throw new Error('Request timed out. The server is taking too long to respond. Please try again.');
    }
    if (error.name === 'AbortError') {
      console.error('❌ [apiRequest] AbortError detected');
      throw new Error('Request was cancelled. Please try again.');
    }
    if (!navigator.onLine) {
      console.error('❌ [apiRequest] Navigator offline');
      throw new Error('Lost internet connection while processing request. Please check your network.');
    }
    // Generic network error
    console.error('❌ [apiRequest] Generic network error');
    throw new Error('Network error occurred. Please check your internet connection and try again.');
  }
};

/**
 * API response types
 */
export interface ApiResponse<T = any> {
  status: 'success' | 'error' | 'fail';
  message?: string;
  data?: T;
  error?: any;
  errors?: Array<{ message?: string; msg?: string; field?: string }>;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    limit: number;
  };
}

/**
 * Parse API response
 */
export const parseApiResponse = async <T = any>(
  response: Response
): Promise<ApiResponse<T>> => {
  try {
    console.log('🔍 [parseApiResponse] Parsing response with status:', response.status);
    const data = await response.json();
    console.log('🔍 [parseApiResponse] Parsed data:', data);
    console.log('🔍 [parseApiResponse] Data keys:', Object.keys(data));
    return data;
  } catch (error) {
    console.error('❌ [parseApiResponse] Failed to parse response:', error);
    return {
      status: 'error',
      message: 'Failed to parse response',
      error,
    };
  }
};
