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
  const token = localStorage.getItem('adminToken');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(getApiUrl(endpoint), {
    ...options,
    headers,
  });
  
  // If unauthorized, clear token and redirect to login
  if (response.status === 401) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminRole');
    window.location.href = '/signin';
  }
  
  return response;
};

/**
 * API response types
 */
export interface ApiResponse<T = any> {
  status: 'success' | 'error' | 'fail';
  message?: string;
  data?: T;
  error?: any;
}

/**
 * Parse API response
 */
export const parseApiResponse = async <T = any>(
  response: Response
): Promise<ApiResponse<T>> => {
  try {
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      status: 'error',
      message: 'Failed to parse response',
      error,
    };
  }
};
