import { useState, useEffect, useRef, useCallback } from 'react';

interface UseDebounceSearchOptions {
  delay?: number;
  minLength?: number;
  onSearchChange?: (value: string) => void;
}

/**
 * Custom hook for debounced search input
 * @param initialValue - Initial search value
 * @param options - Configuration options
 * @returns Object with localValue, debouncedValue, and handleChange
 */
export const useDebounceSearch = (
  initialValue: string = '',
  options: UseDebounceSearchOptions = {}
) => {
  const {
    delay = 500,
    minLength = 2,
    onSearchChange
  } = options;

  const [localValue, setLocalValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const debounceRef = useRef<number | null>(null);

  // Update local value immediately
  const handleChange = useCallback((value: string) => {
    setLocalValue(value);
  }, []);

  // Debounce the search value
  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Only trigger search after user stops typing
    debounceRef.current = window.setTimeout(() => {
      const trimmedValue = localValue.trim();
      
      // Only set debounced value if it meets minimum length or is empty
      if (trimmedValue.length >= minLength || trimmedValue.length === 0) {
        setDebouncedValue(trimmedValue);
        
        // Call callback if provided
        if (onSearchChange) {
          onSearchChange(trimmedValue);
        }
      }
    }, delay);

    // Cleanup
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [localValue, delay, minLength, onSearchChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    localValue,
    debouncedValue,
    handleChange,
    setLocalValue
  };
};
