/**
 * Tests for type utilities
 */

import { 
  Parish, 
  PARISH_NAMES, 
  getParishFromDisplayName, 
  getDisplayNameFromParish, 
  formDataToApiRequest 
} from '../types';
import type { RegistrationFormData } from '../types';

describe('Type utilities', () => {
  describe('getParishFromDisplayName', () => {
    it('should return correct parish for valid display name', () => {
      expect(getParishFromDisplayName('Kingston')).toBe(Parish.KINGSTON);
      expect(getParishFromDisplayName('St. Andrew')).toBe(Parish.ST_ANDREW);
      expect(getParishFromDisplayName('st. andrew')).toBe(Parish.ST_ANDREW); // case insensitive
    });

    it('should return null for invalid display name', () => {
      expect(getParishFromDisplayName('Invalid Parish')).toBeNull();
      expect(getParishFromDisplayName('')).toBeNull();
    });
  });

  describe('getDisplayNameFromParish', () => {
    it('should return correct display name for parish', () => {
      expect(getDisplayNameFromParish(Parish.KINGSTON)).toBe('Kingston');
      expect(getDisplayNameFromParish(Parish.ST_ANDREW)).toBe('St. Andrew');
    });
  });

  describe('formDataToApiRequest', () => {
    const validFormData: RegistrationFormData = {
      firstName: '  John  ',
      lastName: '  Doe  ',
      email: '  TEST@EXAMPLE.COM  ',
      phone: '  876-123-4567  ',
      parish: 'Kingston',
      address: '  123 Main St  ',
      smsAlerts: true,
      emailAlerts: true,
      emergencyOnly: false,
      terms: true,
    };

    it('should convert form data to API request format', () => {
      const result = formDataToApiRequest(validFormData);

      expect(result).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '876-123-4567',
        parish: Parish.KINGSTON,
        address: '123 Main St',
        smsAlerts: true,
        emailAlerts: true,
        emergencyOnly: false,
      });
    });

    it('should handle empty optional fields', () => {
      const formDataWithEmptyFields: RegistrationFormData = {
        ...validFormData,
        phone: '',
        address: '   ',
      };

      const result = formDataToApiRequest(formDataWithEmptyFields);

      expect(result.phone).toBeUndefined();
      expect(result.address).toBeUndefined();
    });

    it('should throw error for invalid parish', () => {
      const invalidFormData: RegistrationFormData = {
        ...validFormData,
        parish: 'Invalid Parish',
      };

      expect(() => formDataToApiRequest(invalidFormData)).toThrow('Invalid parish selected');
    });
  });
});