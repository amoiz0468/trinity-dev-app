import { formatCurrency, formatDate, formatDateTime, formatNumber, truncateText, capitalizeFirst, formatPhone } from '../format';

describe('Format Utils', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(10.99, 'USD')).toBe('$10.99');
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
      expect(formatCurrency(0, 'USD')).toBe('$0.00');
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = '2026-02-03T12:00:00Z';
      const formatted = formatDate(date);
      expect(formatted).toContain('2026');
      expect(formatted).toContain('February');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time correctly', () => {
      const dateTime = '2026-02-03T12:00:00Z';
      const formatted = formatDateTime(dateTime);
      expect(formatted).toContain('2026');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with decimals', () => {
      expect(formatNumber(10.123, 2)).toBe('10.12');
      expect(formatNumber(10.999, 2)).toBe('11.00');
      expect(formatNumber(10, 0)).toBe('10');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      expect(truncateText('This is a long text', 10)).toBe('This is a ...');
      expect(truncateText('Short', 10)).toBe('Short');
    });
  });

  describe('capitalizeFirst', () => {
    it('should capitalize first letter', () => {
      expect(capitalizeFirst('hello')).toBe('Hello');
      expect(capitalizeFirst('HELLO')).toBe('Hello');
      expect(capitalizeFirst('h')).toBe('H');
    });
  });

  describe('formatPhone', () => {
    it('should format phone numbers', () => {
      expect(formatPhone('1234567890')).toBe('(123) 456-7890');
      expect(formatPhone('123')).toBe('123');
    });
  });
});
