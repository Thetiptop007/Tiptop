/**
 * Formats the full order number (e.g., ORD-240513-001) for concise display (e.g., 001).
 * If the order number does not follow the date-prefixed format, it returns it as is.
 */
export const formatOrderNumberForDisplay = (orderNumber: string | undefined): string => {
  if (!orderNumber) return '-';
  
  // Format: ORD-YYMMDD-XXX
  const parts = orderNumber.split('-');
  
  // If it matches our new daily reset format, take the last part (sequence)
  if (parts.length === 3 && parts[0] === 'ORD') {
    return parts[2];
  }
  
  // For legacy format ORD-XXXXXX, we can return the whole thing or just XXXXXX
  if (parts.length === 2 && parts[0] === 'ORD') {
    // If it's a short legacy number, just show the sequence part if it looks like one
    return parts[1];
  }

  return orderNumber;
};
