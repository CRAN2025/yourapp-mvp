/**
 * Normalize phone number to E.164 format
 */
export function normalizeToE164(phone: string): string | null {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle common country codes
  if (digits.length === 10) {
    // Assume North American number if 10 digits
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // North American number with country code
    return `+${digits}`;
  } else if (digits.length > 7 && digits.length <= 15) {
    // International number, add + if missing
    return `+${digits}`;
  }
  
  return null;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const e164 = normalizeToE164(phone);
  if (!e164) return phone;
  
  // Format North American numbers
  if (e164.startsWith('+1')) {
    const digits = e164.substring(2);
    if (digits.length === 10) {
      return `+1 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
    }
  }
  
  return e164;
}

/**
 * Validate phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  const e164 = normalizeToE164(phone);
  return e164 !== null && e164.length >= 8 && e164.length <= 16;
}
