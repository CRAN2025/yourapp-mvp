/**
 * Global WhatsApp-Consuming Countries Database
 * Comprehensive country data for onboarding, settings, and storefront
 */

export interface CountryData {
  region: string;
  name: string;
  code: string;
  dialCode: string;
  currency: string;
  currencySymbol: string;
  flag?: string;
}

// Comprehensive country database for WhatsApp-consuming regions
export const GLOBAL_COUNTRIES: CountryData[] = [
  // Africa
  { region: 'Africa', name: 'Algeria', code: 'DZ', dialCode: '+213', currency: 'Algerian Dinar', currencySymbol: 'DA' },
  { region: 'Africa', name: 'Botswana', code: 'BW', dialCode: '+267', currency: 'Pula', currencySymbol: 'P' },
  { region: 'Africa', name: 'Cameroon', code: 'CM', dialCode: '+237', currency: 'CFA Franc', currencySymbol: 'CFA' },
  { region: 'Africa', name: 'Egypt', code: 'EG', dialCode: '+20', currency: 'Egyptian Pound', currencySymbol: 'E£' },
  { region: 'Africa', name: 'Ethiopia', code: 'ET', dialCode: '+251', currency: 'Ethiopian Birr', currencySymbol: 'Br' },
  { region: 'Africa', name: 'Ghana', code: 'GH', dialCode: '+233', currency: 'Ghanaian Cedi', currencySymbol: 'GH₵' },
  { region: 'Africa', name: 'Ivory Coast', code: 'CI', dialCode: '+225', currency: 'CFA Franc', currencySymbol: 'CFA' },
  { region: 'Africa', name: 'Kenya', code: 'KE', dialCode: '+254', currency: 'Kenyan Shilling', currencySymbol: 'KSh' },
  { region: 'Africa', name: 'Morocco', code: 'MA', dialCode: '+212', currency: 'Moroccan Dirham', currencySymbol: 'MAD' },
  { region: 'Africa', name: 'Namibia', code: 'NA', dialCode: '+264', currency: 'Namibian Dollar', currencySymbol: 'N$' },
  { region: 'Africa', name: 'Nigeria', code: 'NG', dialCode: '+234', currency: 'Naira', currencySymbol: '₦' },
  { region: 'Africa', name: 'Rwanda', code: 'RW', dialCode: '+250', currency: 'Rwandan Franc', currencySymbol: 'FRw' },
  { region: 'Africa', name: 'Senegal', code: 'SN', dialCode: '+221', currency: 'CFA Franc', currencySymbol: 'CFA' },
  { region: 'Africa', name: 'South Africa', code: 'ZA', dialCode: '+27', currency: 'Rand', currencySymbol: 'R' },
  { region: 'Africa', name: 'Tanzania', code: 'TZ', dialCode: '+255', currency: 'Tanzanian Shilling', currencySymbol: 'TSh' },
  { region: 'Africa', name: 'Uganda', code: 'UG', dialCode: '+256', currency: 'Ugandan Shilling', currencySymbol: 'USh' },
  { region: 'Africa', name: 'Zambia', code: 'ZM', dialCode: '+260', currency: 'Zambian Kwacha', currencySymbol: 'ZK' },
  { region: 'Africa', name: 'Zimbabwe', code: 'ZW', dialCode: '+263', currency: 'Zimbabwean Dollar', currencySymbol: 'Z$' },

  // Europe
  { region: 'Europe', name: 'Belgium', code: 'BE', dialCode: '+32', currency: 'Euro', currencySymbol: '€' },
  { region: 'Europe', name: 'Denmark', code: 'DK', dialCode: '+45', currency: 'Danish Krone', currencySymbol: 'kr' },
  { region: 'Europe', name: 'France', code: 'FR', dialCode: '+33', currency: 'Euro', currencySymbol: '€' },
  { region: 'Europe', name: 'Germany', code: 'DE', dialCode: '+49', currency: 'Euro', currencySymbol: '€' },
  { region: 'Europe', name: 'Italy', code: 'IT', dialCode: '+39', currency: 'Euro', currencySymbol: '€' },
  { region: 'Europe', name: 'Netherlands', code: 'NL', dialCode: '+31', currency: 'Euro', currencySymbol: '€' },
  { region: 'Europe', name: 'Norway', code: 'NO', dialCode: '+47', currency: 'Norwegian Krone', currencySymbol: 'kr' },
  { region: 'Europe', name: 'Poland', code: 'PL', dialCode: '+48', currency: 'Polish Złoty', currencySymbol: 'zł' },
  { region: 'Europe', name: 'Portugal', code: 'PT', dialCode: '+351', currency: 'Euro', currencySymbol: '€' },
  { region: 'Europe', name: 'Spain', code: 'ES', dialCode: '+34', currency: 'Euro', currencySymbol: '€' },
  { region: 'Europe', name: 'Sweden', code: 'SE', dialCode: '+46', currency: 'Swedish Krona', currencySymbol: 'kr' },
  { region: 'Europe', name: 'Switzerland', code: 'CH', dialCode: '+41', currency: 'Swiss Franc', currencySymbol: 'CHF' },
  { region: 'Europe', name: 'United Kingdom', code: 'GB', dialCode: '+44', currency: 'Pound Sterling', currencySymbol: '£' },

  // North America
  { region: 'North America', name: 'Canada', code: 'CA', dialCode: '+1', currency: 'Canadian Dollar', currencySymbol: 'C$' },
  { region: 'North America', name: 'United States', code: 'US', dialCode: '+1', currency: 'US Dollar', currencySymbol: '$' },
];

// Utility functions for country data
export const getCountryByCode = (code: string): CountryData | undefined => {
  return GLOBAL_COUNTRIES.find(country => country.code === code);
};

export const getCountryByDialCode = (dialCode: string): CountryData | undefined => {
  return GLOBAL_COUNTRIES.find(country => country.dialCode === dialCode);
};

export const getCountriesByRegion = (region: string): CountryData[] => {
  return GLOBAL_COUNTRIES.filter(country => country.region === region);
};

export const formatPhoneNumber = (phone: string, countryCode: string): string => {
  const country = getCountryByCode(countryCode);
  if (!country) return phone;
  
  // Remove any existing country code and non-digits
  const cleanPhone = phone.replace(/[^\d]/g, '');
  const dialCodeDigits = country.dialCode.replace(/[^\d]/g, '');
  
  // Remove dial code if it's already at the start
  const phoneWithoutDialCode = cleanPhone.startsWith(dialCodeDigits) 
    ? cleanPhone.substring(dialCodeDigits.length)
    : cleanPhone;
  
  return `${country.dialCode}${phoneWithoutDialCode}`;
};

export const formatCurrency = (amount: number, countryCode: string): string => {
  const country = getCountryByCode(countryCode);
  if (!country) return amount.toString();
  
  // Format with thousands separators
  const formattedAmount = amount.toLocaleString();
  
  // Apply currency symbol based on common patterns
  switch (country.currencySymbol) {
    case '$':
    case 'C$':
    case '£':
    case '€':
      return `${country.currencySymbol}${formattedAmount}`;
    default:
      return `${country.currencySymbol} ${formattedAmount}`;
  }
};

// Phone validation patterns by region/country
export const PHONE_VALIDATION_PATTERNS: Record<string, RegExp> = {
  // Africa patterns
  'NG': /^\+234[789]\d{9}$/, // Nigeria
  'KE': /^\+254[17]\d{8}$/, // Kenya  
  'ZA': /^\+27[1-9]\d{8}$/, // South Africa
  'GH': /^\+233[2-9]\d{8}$/, // Ghana
  'ET': /^\+251[19]\d{8}$/, // Ethiopia
  'UG': /^\+256[37]\d{8}$/, // Uganda
  'TZ': /^\+255[67]\d{8}$/, // Tanzania
  'RW': /^\+250[78]\d{8}$/, // Rwanda
  
  // Europe patterns
  'GB': /^\+44[1-9]\d{8,9}$/, // UK
  'DE': /^\+49[1-9]\d{10,11}$/, // Germany
  'FR': /^\+33[1-9]\d{8}$/, // France
  'IT': /^\+39[3]\d{8,9}$/, // Italy
  'ES': /^\+34[6-9]\d{8}$/, // Spain
  
  // North America patterns
  'US': /^\+1[2-9]\d{9}$/, // USA
  'CA': /^\+1[2-9]\d{9}$/, // Canada
};

export const validatePhoneNumber = (phone: string, countryCode: string): boolean => {
  const pattern = PHONE_VALIDATION_PATTERNS[countryCode];
  if (!pattern) {
    // Generic validation for countries without specific patterns
    const country = getCountryByCode(countryCode);
    if (!country) return false;
    
    const dialCodeDigits = country.dialCode.replace(/[^\d]/g, '');
    const phoneRegex = new RegExp(`^\\${country.dialCode}\\d{7,12}$`);
    return phoneRegex.test(phone);
  }
  
  return pattern.test(phone);
};

// Comprehensive language list based on countries and regions
export const GLOBAL_LANGUAGES = [
  // Major international languages
  'English',
  'French', 
  'Spanish',
  'Portuguese',
  'German',
  'Italian',
  'Dutch',
  
  // African languages  
  'Swahili',
  'Hausa',
  'Yoruba',
  'Igbo',
  'Amharic',
  'Wolof',
  'Akan',
  'Zulu',
  'Afrikaans',
  
  // Middle Eastern/North African
  'Arabic',
  'Berber',
  
  // European languages
  'Danish',
  'Norwegian',
  'Swedish',
  'Polish',
  
  // Other
  'Other'
] as const;

export type GlobalLanguage = typeof GLOBAL_LANGUAGES[number];

export default GLOBAL_COUNTRIES;