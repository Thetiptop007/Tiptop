/**
 * Order Management Utilities
 * Helper functions for handling order operations with edge case protection
 */

/**
 * Generate idempotency key for order operations
 */
export const generateIdempotencyKey = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${timestamp}-${random}`;
};

/**
 * Debounce function to prevent multiple rapid calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Retry failed API calls with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
        throw error;
      }
      
      // Last attempt - throw the error
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

/**
 * Check if network is available
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Wait for network to be back online
 */
export const waitForOnline = (timeoutMs: number = 30000): Promise<boolean> => {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve(true);
      return;
    }
    
    const timeout = setTimeout(() => {
      window.removeEventListener('online', onlineHandler);
      resolve(false);
    }, timeoutMs);
    
    const onlineHandler = () => {
      clearTimeout(timeout);
      window.removeEventListener('online', onlineHandler);
      resolve(true);
    };
    
    window.addEventListener('online', onlineHandler);
  });
};

/**
 * Request state manager to prevent duplicate requests
 */
class RequestStateManager {
  private pendingRequests: Map<string, Promise<any>>;
  private requestTimestamps: Map<string, number>;
  private readonly DUPLICATE_WINDOW_MS = 3000; // 3 seconds
  
  constructor() {
    this.pendingRequests = new Map();
    this.requestTimestamps = new Map();
  }
  
  /**
   * Check if a request with this key is already in progress
   */
  isPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }
  
  /**
   * Check if this is a duplicate request within the time window
   */
  isDuplicate(key: string): boolean {
    const lastTimestamp = this.requestTimestamps.get(key);
    if (!lastTimestamp) return false;
    
    const timeSinceLastRequest = Date.now() - lastTimestamp;
    return timeSinceLastRequest < this.DUPLICATE_WINDOW_MS;
  }
  
  /**
   * Execute a request, ensuring it's not duplicated
   */
  async executeRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if duplicate
    if (this.isDuplicate(key)) {
      console.warn(`Duplicate request blocked: ${key}`);
      throw new Error('Please wait before trying again');
    }
    
    // Check if already pending
    if (this.isPending(key)) {
      console.warn(`Request already in progress: ${key}`);
      return this.pendingRequests.get(key)!;
    }
    
    // Mark timestamp
    this.requestTimestamps.set(key, Date.now());
    
    // Execute request
    const promise = requestFn();
    this.pendingRequests.set(key, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
      // Keep timestamp for duplicate detection
    }
  }
  
  /**
   * Clear old timestamps (cleanup)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.requestTimestamps.entries()) {
      if (now - timestamp > this.DUPLICATE_WINDOW_MS * 2) {
        this.requestTimestamps.delete(key);
      }
    }
  }
}

// Singleton instance
export const requestStateManager = new RequestStateManager();

// Cleanup old timestamps every minute
setInterval(() => {
  requestStateManager.cleanup();
}, 60000);

/**
 * Network error handler
 */
export const handleNetworkError = (error: any): string => {
  if (!navigator.onLine) {
    return 'No internet connection. Please check your network and try again.';
  }
  
  if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
    return 'Request timeout. Please try again.';
  }
  
  if (error.response?.status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  if (error.response?.status === 409) {
    return 'This action is already being processed. Please wait.';
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  return 'An error occurred. Please try again.';
};
