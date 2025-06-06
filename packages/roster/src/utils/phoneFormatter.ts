/**
 * Formats phone numbers for Apple Messages compatibility
 * Cleans and standardizes phone number formats for optimal messaging app integration
 */

export interface PhoneFormatOptions {
  /** Include country code prefix (default: true) */
  includeCountryCode?: boolean;
  /** Country code to use if not present (default: '1' for US) */
  defaultCountryCode?: string;
  /** Separator between phone numbers when formatting multiple (default: ', ') */
  separator?: string;
}

/**
 * Cleans a phone number string by removing non-digit characters except +
 */
function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Determines if a phone number already has a country code
 */
function hasCountryCode(phone: string): boolean {
  const cleaned = cleanPhoneNumber(phone);
  // Check if starts with + or has more than 10 digits (assuming US base)
  return cleaned.startsWith('+') || cleaned.length > 10;
}

/**
 * Formats a single phone number for Apple Messages
 */
export function formatPhoneNumber(
  phone: string | null | undefined,
  options: PhoneFormatOptions = {}
): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  const { includeCountryCode = true, defaultCountryCode = '1' } = options;

  const cleaned = cleanPhoneNumber(phone.trim());

  if (!cleaned || cleaned.length < 10) {
    return null; // Invalid phone number
  }

  // If phone already has country code (starts with + or is longer than 10 digits)
  if (hasCountryCode(cleaned)) {
    if (cleaned.startsWith('+')) {
      return cleaned; // Already properly formatted
    }
    // Assume the extra digits are country code
    return includeCountryCode ? `+${cleaned}` : cleaned.slice(-10);
  }

  // Standard 10-digit US number
  if (cleaned.length === 10) {
    return includeCountryCode ? `+${defaultCountryCode}${cleaned}` : cleaned;
  }

  // 11-digit number starting with 1 (US format)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return includeCountryCode ? `+${cleaned}` : cleaned.slice(1);
  }

  // Fallback: treat as international if longer than 11 digits
  if (cleaned.length > 11) {
    return includeCountryCode ? `+${cleaned}` : cleaned;
  }

  return null; // Unable to format
}

/**
 * Formats multiple phone numbers for Apple Messages
 * Returns a comma-separated string of formatted phone numbers
 */
export function formatPhoneNumbers(
  phones: (string | null | undefined)[],
  options: PhoneFormatOptions = {}
): string {
  const { separator = ', ' } = options;

  const formatted = phones
    .map(phone => formatPhoneNumber(phone, options))
    .filter((phone): phone is string => phone !== null);

  return formatted.join(separator);
}

/**
 * Formats phone numbers from an array of objects with phone properties
 * Useful for musician arrays or similar data structures
 */
export function formatPhoneNumbersFromObjects<
  T extends { phone?: string | null },
>(objects: T[], options: PhoneFormatOptions = {}): string {
  const phones = objects.map(obj => obj.phone);
  return formatPhoneNumbers(phones, options);
}

/**
 * Validates if a phone number can be successfully formatted
 */
export function isValidPhoneNumber(phone: string | null | undefined): boolean {
  return formatPhoneNumber(phone) !== null;
}

/**
 * Gets statistics about phone number formatting for a collection
 */
export function getPhoneFormatStats(phones: (string | null | undefined)[]): {
  total: number;
  valid: number;
  invalid: number;
  validPercentage: number;
} {
  const total = phones.length;
  const valid = phones.filter(isValidPhoneNumber).length;
  const invalid = total - valid;
  const validPercentage = total > 0 ? (valid / total) * 100 : 0;

  return {
    total,
    valid,
    invalid,
    validPercentage: Math.round(validPercentage * 100) / 100,
  };
}
