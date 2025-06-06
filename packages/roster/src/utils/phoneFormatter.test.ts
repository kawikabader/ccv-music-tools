import { describe, it, expect } from 'vitest';
import {
  formatPhoneNumber,
  formatPhoneNumbers,
  formatPhoneNumbersFromObjects,
  isValidPhoneNumber,
  getPhoneFormatStats,
  type PhoneFormatOptions,
} from './phoneFormatter';

describe('phoneFormatter', () => {
  describe('formatPhoneNumber', () => {
    describe('basic functionality', () => {
      it('should format standard 10-digit US number with default options', () => {
        expect(formatPhoneNumber('1234567890')).toBe('+11234567890');
      });

      it('should format 11-digit US number starting with 1', () => {
        expect(formatPhoneNumber('11234567890')).toBe('+11234567890');
      });

      it('should format phone number with spaces and dashes', () => {
        expect(formatPhoneNumber('123-456-7890')).toBe('+11234567890');
        expect(formatPhoneNumber('123 456 7890')).toBe('+11234567890');
        expect(formatPhoneNumber('(123) 456-7890')).toBe('+11234567890');
      });

      it('should handle phone numbers with parentheses and dots', () => {
        expect(formatPhoneNumber('(123) 456.7890')).toBe('+11234567890');
        expect(formatPhoneNumber('123.456.7890')).toBe('+11234567890');
      });

      it('should preserve existing + prefix', () => {
        expect(formatPhoneNumber('+11234567890')).toBe('+11234567890');
        expect(formatPhoneNumber('+441234567890')).toBe('+441234567890');
      });
    });

    describe('country code handling', () => {
      it('should add default country code when includeCountryCode is true', () => {
        expect(
          formatPhoneNumber('1234567890', { includeCountryCode: true })
        ).toBe('+11234567890');
      });

      it('should omit country code when includeCountryCode is false', () => {
        expect(
          formatPhoneNumber('1234567890', { includeCountryCode: false })
        ).toBe('1234567890');
        expect(
          formatPhoneNumber('11234567890', { includeCountryCode: false })
        ).toBe('1234567890');
      });

      it('should use custom default country code', () => {
        expect(
          formatPhoneNumber('1234567890', { defaultCountryCode: '44' })
        ).toBe('+441234567890');
      });

      it('should strip country code when includeCountryCode is false for international numbers', () => {
        expect(
          formatPhoneNumber('+441234567890', { includeCountryCode: false })
        ).toBe('1234567890');
        expect(
          formatPhoneNumber('441234567890', { includeCountryCode: false })
        ).toBe('1234567890');
      });
    });

    describe('international numbers', () => {
      it('should handle UK numbers', () => {
        expect(formatPhoneNumber('441234567890')).toBe('+441234567890');
        expect(formatPhoneNumber('+44 123 456 7890')).toBe('+441234567890');
      });

      it('should handle numbers with more than 11 digits', () => {
        expect(formatPhoneNumber('123456789012')).toBe('+123456789012');
      });

      it('should handle very long international numbers', () => {
        expect(formatPhoneNumber('12345678901234')).toBe('+12345678901234');
      });
    });

    describe('edge cases and validation', () => {
      it('should return null for null or undefined input', () => {
        expect(formatPhoneNumber(null)).toBe(null);
        expect(formatPhoneNumber(undefined)).toBe(null);
      });

      it('should return null for non-string input', () => {
        expect(formatPhoneNumber(123 as any)).toBe(null);
        expect(formatPhoneNumber({} as any)).toBe(null);
        expect(formatPhoneNumber([] as any)).toBe(null);
      });

      it('should return null for empty string', () => {
        expect(formatPhoneNumber('')).toBe(null);
        expect(formatPhoneNumber('   ')).toBe(null);
      });

      it('should return null for too short numbers', () => {
        expect(formatPhoneNumber('123')).toBe(null);
        expect(formatPhoneNumber('123456789')).toBe(null); // 9 digits
      });

      it('should handle strings with only non-digit characters', () => {
        expect(formatPhoneNumber('abc-def-ghij')).toBe(null);
        expect(formatPhoneNumber('----------')).toBe(null);
      });

      it('should handle mixed valid and invalid characters', () => {
        expect(formatPhoneNumber('1a2b3c4d5e6f7g8h9i0j')).toBe('+11234567890');
      });

      it('should trim whitespace', () => {
        expect(formatPhoneNumber('  1234567890  ')).toBe('+11234567890');
      });
    });

    describe('ambiguous cases', () => {
      it('should handle 11-digit numbers not starting with 1', () => {
        expect(formatPhoneNumber('21234567890')).toBe('+21234567890');
      });

      it('should handle exactly 11 digits starting with 1', () => {
        expect(formatPhoneNumber('11234567890')).toBe('+11234567890');
      });
    });
  });

  describe('formatPhoneNumbers', () => {
    it('should format multiple valid phone numbers', () => {
      const phones = ['1234567890', '9876543210', '5555551234'];
      const result = formatPhoneNumbers(phones);
      expect(result).toBe('+11234567890, +19876543210, +15555551234');
    });

    it('should filter out invalid phone numbers', () => {
      const phones = ['1234567890', '123', null, undefined, '9876543210'];
      const result = formatPhoneNumbers(phones);
      expect(result).toBe('+11234567890, +19876543210');
    });

    it('should handle empty array', () => {
      expect(formatPhoneNumbers([])).toBe('');
    });

    it('should handle array with all invalid numbers', () => {
      const phones = ['123', null, undefined, ''];
      expect(formatPhoneNumbers(phones)).toBe('');
    });

    it('should use custom separator', () => {
      const phones = ['1234567890', '9876543210'];
      const result = formatPhoneNumbers(phones, { separator: ' | ' });
      expect(result).toBe('+11234567890 | +19876543210');
    });

    it('should handle single phone number', () => {
      expect(formatPhoneNumbers(['1234567890'])).toBe('+11234567890');
    });

    it('should apply options to all phone numbers', () => {
      const phones = ['1234567890', '9876543210'];
      const result = formatPhoneNumbers(phones, {
        includeCountryCode: false,
        separator: '; ',
      });
      expect(result).toBe('1234567890; 9876543210');
    });

    it('should handle mixed valid and invalid with custom options', () => {
      const phones = ['1234567890', '123', '+441234567890'];
      const result = formatPhoneNumbers(phones, {
        includeCountryCode: false,
        separator: ' / ',
      });
      expect(result).toBe('1234567890 / 1234567890');
    });
  });

  describe('formatPhoneNumbersFromObjects', () => {
    interface TestMusician {
      id: number;
      name: string;
      phone?: string | null;
    }

    it('should format phone numbers from object array', () => {
      const musicians: TestMusician[] = [
        { id: 1, name: 'John', phone: '1234567890' },
        { id: 2, name: 'Jane', phone: '9876543210' },
      ];
      const result = formatPhoneNumbersFromObjects(musicians);
      expect(result).toBe('+11234567890, +19876543210');
    });

    it('should handle objects with missing phone property', () => {
      const musicians: TestMusician[] = [
        { id: 1, name: 'John', phone: '1234567890' },
        { id: 2, name: 'Jane' }, // no phone property
        { id: 3, name: 'Bob', phone: '5555551234' },
      ];
      const result = formatPhoneNumbersFromObjects(musicians);
      expect(result).toBe('+11234567890, +15555551234');
    });

    it('should handle objects with null phone values', () => {
      const musicians: TestMusician[] = [
        { id: 1, name: 'John', phone: '1234567890' },
        { id: 2, name: 'Jane', phone: null },
        { id: 3, name: 'Bob', phone: '5555551234' },
      ];
      const result = formatPhoneNumbersFromObjects(musicians);
      expect(result).toBe('+11234567890, +15555551234');
    });

    it('should handle empty array', () => {
      expect(formatPhoneNumbersFromObjects([])).toBe('');
    });

    it('should apply options to object phone numbers', () => {
      const musicians: TestMusician[] = [
        { id: 1, name: 'John', phone: '1234567890' },
        { id: 2, name: 'Jane', phone: '9876543210' },
      ];
      const result = formatPhoneNumbersFromObjects(musicians, {
        includeCountryCode: false,
        separator: ' & ',
      });
      expect(result).toBe('1234567890 & 9876543210');
    });

    it('should work with objects having different structures', () => {
      const contacts = [
        { name: 'Contact 1', phone: '1234567890', email: 'test@example.com' },
        { name: 'Contact 2', phone: '9876543210', active: true },
      ];
      const result = formatPhoneNumbersFromObjects(contacts);
      expect(result).toBe('+11234567890, +19876543210');
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should return true for valid phone numbers', () => {
      expect(isValidPhoneNumber('1234567890')).toBe(true);
      expect(isValidPhoneNumber('11234567890')).toBe(true);
      expect(isValidPhoneNumber('+11234567890')).toBe(true);
      expect(isValidPhoneNumber('(123) 456-7890')).toBe(true);
      expect(isValidPhoneNumber('+441234567890')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(isValidPhoneNumber('123')).toBe(false);
      expect(isValidPhoneNumber('123456789')).toBe(false); // 9 digits
      expect(isValidPhoneNumber('')).toBe(false);
      expect(isValidPhoneNumber(null)).toBe(false);
      expect(isValidPhoneNumber(undefined)).toBe(false);
      expect(isValidPhoneNumber('abc')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidPhoneNumber('   ')).toBe(false);
      expect(isValidPhoneNumber('----------')).toBe(false);
      expect(isValidPhoneNumber('1a2b3c4d5e6f7g8h9i0j')).toBe(true); // has 10 digits mixed with letters
    });
  });

  describe('getPhoneFormatStats', () => {
    it('should calculate stats for mixed valid and invalid numbers', () => {
      const phones = [
        '1234567890', // valid
        '123', // invalid
        '9876543210', // valid
        null, // invalid
        '+441234567890', // valid
        undefined, // invalid
        '', // invalid
      ];

      const stats = getPhoneFormatStats(phones);
      expect(stats).toEqual({
        total: 7,
        valid: 3,
        invalid: 4,
        validPercentage: 42.86,
      });
    });

    it('should handle all valid numbers', () => {
      const phones = ['1234567890', '9876543210', '+441234567890'];
      const stats = getPhoneFormatStats(phones);
      expect(stats).toEqual({
        total: 3,
        valid: 3,
        invalid: 0,
        validPercentage: 100,
      });
    });

    it('should handle all invalid numbers', () => {
      const phones = ['123', null, undefined, ''];
      const stats = getPhoneFormatStats(phones);
      expect(stats).toEqual({
        total: 4,
        valid: 0,
        invalid: 4,
        validPercentage: 0,
      });
    });

    it('should handle empty array', () => {
      const stats = getPhoneFormatStats([]);
      expect(stats).toEqual({
        total: 0,
        valid: 0,
        invalid: 0,
        validPercentage: 0,
      });
    });

    it('should handle single valid number', () => {
      const stats = getPhoneFormatStats(['1234567890']);
      expect(stats).toEqual({
        total: 1,
        valid: 1,
        invalid: 0,
        validPercentage: 100,
      });
    });

    it('should handle single invalid number', () => {
      const stats = getPhoneFormatStats(['123']);
      expect(stats).toEqual({
        total: 1,
        valid: 0,
        invalid: 1,
        validPercentage: 0,
      });
    });

    it('should round percentage correctly', () => {
      // 1 valid out of 3 = 33.333...%
      const phones = ['1234567890', '123', '456'];
      const stats = getPhoneFormatStats(phones);
      expect(stats.validPercentage).toBe(33.33);
    });

    it('should handle large datasets', () => {
      const phones = Array(1000)
        .fill('1234567890')
        .concat(Array(500).fill('123'));
      const stats = getPhoneFormatStats(phones);
      expect(stats).toEqual({
        total: 1500,
        valid: 1000,
        invalid: 500,
        validPercentage: 66.67,
      });
    });
  });

  describe('options interface', () => {
    it('should handle all options together', () => {
      const options: PhoneFormatOptions = {
        includeCountryCode: false,
        defaultCountryCode: '44',
        separator: ' | ',
      };

      const phones = ['1234567890', '9876543210'];
      const result = formatPhoneNumbers(phones, options);
      expect(result).toBe('1234567890 | 9876543210');
    });

    it('should use default values when options not provided', () => {
      expect(formatPhoneNumber('1234567890', {})).toBe('+11234567890');
      expect(formatPhoneNumbers(['1234567890', '9876543210'], {})).toBe(
        '+11234567890, +19876543210'
      );
    });

    it('should allow partial options', () => {
      expect(
        formatPhoneNumber('1234567890', { includeCountryCode: false })
      ).toBe('1234567890');
      expect(formatPhoneNumbers(['1234567890'], { separator: ' & ' })).toBe(
        '+11234567890'
      );
    });
  });

  describe('real-world scenarios', () => {
    it('should handle typical musician roster data', () => {
      const musicians = [
        { name: 'John Smith', phone: '(555) 123-4567' },
        { name: 'Jane Doe', phone: '555.987.6543' },
        { name: 'Bob Wilson', phone: '+1 555 111 2222' },
        { name: 'Alice Brown', phone: null },
        { name: 'Charlie Davis', phone: '123' }, // invalid
      ];

      const result = formatPhoneNumbersFromObjects(musicians);
      expect(result).toBe('+15551234567, +15559876543, +15551112222');

      const stats = getPhoneFormatStats(musicians.map(m => m.phone));
      expect(stats.valid).toBe(3);
      expect(stats.invalid).toBe(2);
    });

    it('should handle international roster', () => {
      const phones = [
        '+1-555-123-4567', // US
        '+44 20 1234 5678', // UK
        '011 33 1 2345 6789', // France (with international prefix)
        '555-123-4567', // US without country code
      ];

      const formatted = formatPhoneNumbers(phones);
      expect(formatted).toContain('+15551234567');
      expect(formatted).toContain('+442012345678');
      expect(formatted).toContain('+15551234567');
    });

    it('should handle copy-paste scenarios from different sources', () => {
      const messyPhones = [
        ' (555) 123-4567 ', // spaced
        'Tel: 555.987.6543', // with prefix
        'Mobile: +1 555 111 2222', // with label
        '555-444-3333 (work)', // with suffix
        'Call me at 555-777-8888!', // in sentence
      ];

      const cleaned = messyPhones.map(phone => {
        // Simulate cleaning common prefixes/suffixes that users might copy
        return phone
          .replace(/Tel:\s*|Mobile:\s*|Call me at\s*|[\s!]/g, '')
          .replace(/\s*\(work\)/, '');
      });

      const result = formatPhoneNumbers(cleaned);
      expect(result).toContain('+15551234567');
      expect(result).toContain('+15559876543');
    });
  });
});
