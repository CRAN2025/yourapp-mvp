// Phone.jsx
// Phone number utilities for E.164 normalization and validation

/**
 * Normalize a phone number to E.164 format
 * @param {string} rawNumber - The raw phone number input
 * @param {string} defaultCountry - Default country code (e.g., 'GH' for Ghana)
 * @returns {string|null} - E.164 formatted number or null if invalid
 */
export const normalizeToE164 = (rawNumber, defaultCountry = 'GH') => {
  if (!rawNumber || typeof rawNumber !== 'string') {
    return null
  }

  // Remove all non-digit characters except +
  let cleaned = rawNumber.replace(/[^\d+]/g, '')
  
  // If it starts with +, keep it as is
  if (cleaned.startsWith('+')) {
    // Validate E.164 format: +[1-3 digits country code][4-14 digits]
    if (/^\+[1-9]\d{1,3}\d{4,14}$/.test(cleaned) && cleaned.length >= 8 && cleaned.length <= 18) {
      return cleaned
    }
    return null
  }
  
  // Country-specific normalization
  const countryRules = {
    'GH': { // Ghana
      prefix: '+233',
      localLength: [9], // 9 digits after country code
      // Remove leading 0 if present
      normalize: (num) => num.startsWith('0') ? num.substring(1) : num
    },
    'NG': { // Nigeria
      prefix: '+234',
      localLength: [10],
      normalize: (num) => num.startsWith('0') ? num.substring(1) : num
    },
    'KE': { // Kenya
      prefix: '+254',
      localLength: [9],
      normalize: (num) => num.startsWith('0') ? num.substring(1) : num
    },
    'ZA': { // South Africa
      prefix: '+27',
      localLength: [9],
      normalize: (num) => num.startsWith('0') ? num.substring(1) : num
    },
    'US': { // United States
      prefix: '+1',
      localLength: [10],
      normalize: (num) => num
    }
  }

  const rule = countryRules[defaultCountry.toUpperCase()]
  if (!rule) {
    // Fallback: assume it's a local number and add Ghana prefix
    const normalized = cleaned.startsWith('0') ? cleaned.substring(1) : cleaned
    if (normalized.length === 9) {
      return `+233${normalized}`
    }
    return null
  }

  const normalized = rule.normalize(cleaned)
  
  // Check if the normalized number matches expected local length
  if (rule.localLength.includes(normalized.length)) {
    return `${rule.prefix}${normalized}`
  }
  
  // Check if it's already in international format without +
  if (cleaned.startsWith(rule.prefix.substring(1))) {
    return `+${cleaned}`
  }
  
  return null
}

/**
 * Validate if a string is in valid E.164 format
 * @param {string} phoneNumber - The phone number to validate
 * @returns {boolean} - True if valid E.164 format
 */
export const isValidPhoneE164 = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false
  }
  
  // E.164 regex: +[1-3 digits country code][4-14 digits national number]
  // Total length: 7-18 characters
  const e164Regex = /^\+[1-9]\d{1,3}\d{4,14}$/
  return e164Regex.test(phoneNumber) && phoneNumber.length >= 8 && phoneNumber.length <= 18
}

/**
 * Enhanced phone validation that returns detailed validation result
 * @param {string} phoneNumber - The phone number to validate
 * @param {string} country - Country code for normalization context
 * @returns {object} - { isValid: boolean, error: string|null, normalized: string|null }
 */
export const validatePhoneNumber = (phoneNumber, country = 'GH') => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return {
      isValid: false,
      error: 'Phone number is required',
      normalized: null
    }
  }

  const normalized = normalizeToE164(phoneNumber, country)
  
  if (!normalized) {
    return {
      isValid: false,
      error: 'Please enter a valid phone number with country code',
      normalized: null
    }
  }

  if (!isValidPhoneE164(normalized)) {
    return {
      isValid: false,
      error: 'Invalid phone number format',
      normalized: null
    }
  }

  return {
    isValid: true,
    error: null,
    normalized: normalized
  }
}

/**
 * Check if phone number needs updating to E.164 format
 * @param {string} phoneNumber - The phone number to check
 * @returns {boolean} - True if phone number needs updating
 */
export const phoneNeedsUpdate = (phoneNumber) => {
  if (!phoneNumber) return false;
  return !isValidPhoneE164(phoneNumber);
};

/**
 * Get phone number input hint based on country
 * @param {string} country - Country code (e.g., 'GH')
 * @returns {string} - Hint text for the user
 */
export const getPhoneHint = (country = 'GH') => {
  const hints = {
    'GH': 'Include country code, e.g., +233 24 123 4567 or 0241234567',
    'NG': 'Include country code, e.g., +234 803 123 4567 or 08031234567',
    'KE': 'Include country code, e.g., +254 712 345 678 or 0712345678',
    'ZA': 'Include country code, e.g., +27 82 123 4567 or 0821234567',
    'US': 'Include country code, e.g., +1 555 123 4567'
  }
  
  return hints[country.toUpperCase()] || hints['GH']
}

/**
 * Format phone number for display (optional, for UI purposes)
 * @param {string} e164Number - E.164 formatted number
 * @returns {string} - Formatted for display
 */
export const formatPhoneForDisplay = (e164Number) => {
  if (!isValidPhoneE164(e164Number)) {
    return e164Number || ''
  }

  // Simple formatting for common country codes
  if (e164Number.startsWith('+233')) { // Ghana
    const local = e164Number.substring(4)
    if (local.length === 9) {
      return `+233 ${local.substring(0, 2)} ${local.substring(2, 5)} ${local.substring(5)}`
    }
  } else if (e164Number.startsWith('+1')) { // US/Canada
    const local = e164Number.substring(2)
    if (local.length === 10) {
      return `+1 (${local.substring(0, 3)}) ${local.substring(3, 6)}-${local.substring(6)}`
    }
  } else if (e164Number.startsWith('+234')) { // Nigeria
    const local = e164Number.substring(4)
    if (local.length === 10) {
      return `+234 ${local.substring(0, 3)} ${local.substring(3, 6)} ${local.substring(6)}`
    }
  }
  
  // Default: just return the E.164 number
  return e164Number
}

/**
 * Generate WhatsApp chat URL
 * @param {string} phoneNumber - E.164 formatted phone number
 * @param {string} message - Pre-filled message (optional)
 * @returns {string|null} - WhatsApp URL or null if invalid number
 */
export const generateWhatsAppURL = (phoneNumber, message = '') => {
  if (!isValidPhoneE164(phoneNumber)) {
    return null
  }
  
  // Remove the + for WhatsApp URL
  const waNumber = phoneNumber.substring(1)
  const encodedMessage = message ? encodeURIComponent(message) : ''
  
  return `https://wa.me/${waNumber}${encodedMessage ? `?text=${encodedMessage}` : ''}`
}