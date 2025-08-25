// Country-specific phone validation patterns
const countryPhonePatterns: Record<string, { code: string; pattern: RegExp; hint: string }> = {
  'US': { code: '+1', pattern: /^\+1\d{10}$/, hint: '+1 (555) 123-4567' },
  'CA': { code: '+1', pattern: /^\+1\d{10}$/, hint: '+1 (555) 123-4567' },
  'GB': { code: '+44', pattern: /^\+44\d{10,11}$/, hint: '+44 20 7123 4567' },
  'DE': { code: '+49', pattern: /^\+49\d{10,12}$/, hint: '+49 30 12345678' },
  'FR': { code: '+33', pattern: /^\+33\d{9,10}$/, hint: '+33 1 23 45 67 89' },
  'IT': { code: '+39', pattern: /^\+39\d{9,11}$/, hint: '+39 06 1234 5678' },
  'ES': { code: '+34', pattern: /^\+34\d{9}$/, hint: '+34 91 123 4567' },
  'NL': { code: '+31', pattern: /^\+31\d{9}$/, hint: '+31 20 123 4567' },
  'AU': { code: '+61', pattern: /^\+61\d{9}$/, hint: '+61 2 1234 5678' },
  'GH': { code: '+233', pattern: /^\+233\d{9}$/, hint: '+233 20 123 4567' },
  'NG': { code: '+234', pattern: /^\+234\d{10}$/, hint: '+234 80 1234 5678' },
  'KE': { code: '+254', pattern: /^\+254\d{9}$/, hint: '+254 70 123 4567' },
  'ZA': { code: '+27', pattern: /^\+27\d{9}$/, hint: '+27 82 123 4567' },
  'IN': { code: '+91', pattern: /^\+91\d{10}$/, hint: '+91 98765 43210' },
  'SG': { code: '+65', pattern: /^\+65\d{8}$/, hint: '+65 9123 4567' },
  'AE': { code: '+971', pattern: /^\+971\d{8,9}$/, hint: '+971 50 123 4567' },
};

/**
 * Validate phone number for specific country
 */
export function validatePhoneNumber(phone: string, countryCode: string): { isValid: boolean; error?: string; normalized?: string } {
  if (!phone) return { isValid: false, error: 'Phone number is required' };
  
  // Get country pattern
  const pattern = countryPhonePatterns[countryCode];
  if (!pattern) {
    // Fallback to generic validation
    const normalized = normalizeToE164(phone);
    return {
      isValid: !!normalized,
      error: normalized ? undefined : 'Invalid phone number format',
      normalized: normalized || undefined
    };
  }
  
  // Auto-format: Clean and normalize
  let normalized = phone.replace(/[\s\-\(\)]/g, ''); // Remove spaces, dashes, parentheses
  
  // Remove leading zeros
  normalized = normalized.replace(/^0+/, '');
  
  // If no country code, auto-add it based on selected country
  if (!normalized.startsWith('+') && !normalized.startsWith(pattern.code.substring(1))) {
    normalized = pattern.code + normalized;
  } else if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }
  
  const isValid = pattern.pattern.test(normalized);
  return {
    isValid,
    error: isValid ? undefined : `Invalid phone number. Expected format: ${pattern.hint}`,
    normalized: isValid ? normalized : undefined
  };
}

/**
 * Get phone number hint for country
 */
export function getPhoneHint(countryCode: string): string {
  return countryPhonePatterns[countryCode]?.hint || '+XX XXX XXX XXXX';
}

/**
 * Normalize phone number to E.164 format
 */
export function normalizeToE164(phone: string): string | null {
  if (!phone) return null;
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If no +, try to add it
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  // Basic validation - should be between 8-16 digits total
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) {
    return null;
  }
  
  return cleaned;
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
