import { validateEmail, validatePassword, validatePhone, validateZipCode, validateName, validateAddress } from '../validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should return true for valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should return valid for strong passwords', () => {
      const result = validatePassword('Test123456');
      expect(result.isValid).toBe(true);
    });

    it('should return invalid for passwords less than 8 characters', () => {
      const result = validatePassword('Test12');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 8 characters');
    });

    it('should return invalid for passwords without uppercase', () => {
      const result = validatePassword('test123456');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('uppercase letter');
    });

    it('should return invalid for passwords without lowercase', () => {
      const result = validatePassword('TEST123456');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('lowercase letter');
    });

    it('should return invalid for passwords without numbers', () => {
      const result = validatePassword('TestPassword');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('number');
    });
  });

  describe('validatePhone', () => {
    it('should return true for valid phone numbers', () => {
      expect(validatePhone('1234567890')).toBe(true);
      expect(validatePhone('+1 (123) 456-7890')).toBe(true);
      expect(validatePhone('123-456-7890')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abc')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });
  });

  describe('validateZipCode', () => {
    it('should return true for valid zip codes', () => {
      expect(validateZipCode('12345')).toBe(true);
      expect(validateZipCode('12345-6789')).toBe(true);
      expect(validateZipCode('ABC123')).toBe(true);
    });

    it('should return false for invalid zip codes', () => {
      expect(validateZipCode('123')).toBe(false);
      expect(validateZipCode('')).toBe(false);
    });
  });

  describe('validateName', () => {
    it('should return true for valid names', () => {
      expect(validateName('John')).toBe(true);
      expect(validateName('Mary-Jane')).toBe(true);
      expect(validateName("O'Brien")).toBe(true);
    });

    it('should return false for invalid names', () => {
      expect(validateName('J')).toBe(false);
      expect(validateName('John123')).toBe(false);
      expect(validateName('')).toBe(false);
    });
  });

  describe('validateAddress', () => {
    it('should return true for valid addresses', () => {
      expect(validateAddress('123 Main Street')).toBe(true);
      expect(validateAddress('Apt 5B, 456 Oak Avenue')).toBe(true);
    });

    it('should return false for invalid addresses', () => {
      expect(validateAddress('123')).toBe(false);
      expect(validateAddress('')).toBe(false);
    });
  });
});
