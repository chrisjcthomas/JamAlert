import { z } from 'zod';
import { Parish } from '@prisma/client';

export class ValidationService {
  /**
   * Sanitize and format phone number
   */
  sanitizePhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // If it starts with +1876 (Jamaica country code), keep it
    if (cleaned.startsWith('+1876')) {
      return cleaned;
    }
    
    // If it starts with 1876, add +
    if (cleaned.startsWith('1876')) {
      return '+' + cleaned;
    }
    
    // If it starts with 876, add +1
    if (cleaned.startsWith('876')) {
      return '+1' + cleaned;
    }
    
    // If it's a 7-digit local number, add +1876
    if (cleaned.length === 7) {
      return '+1876' + cleaned;
    }
    
    // If it's a 10-digit number starting with area code, add +1
    if (cleaned.length === 10 && cleaned.startsWith('876')) {
      return '+1' + cleaned;
    }
    
    // Return as-is if we can't determine format
    return cleaned;
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailSchema = z.string().email();
    try {
      emailSchema.parse(email);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize text input (remove potentially harmful characters)
   */
  sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes that could cause issues
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate parish
   */
  validateParish(parish: string): boolean {
    return Object.values(Parish).includes(parish as Parish);
  }

  /**
   * Sanitize name (allow only letters, spaces, hyphens, apostrophes)
   */
  sanitizeName(name: string): string {
    return name
      .trim()
      .replace(/[^a-zA-Z\s\-']/g, '')
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .substring(0, 100); // Limit length
  }

  /**
   * Validate and sanitize address
   */
  sanitizeAddress(address: string): string {
    return address
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML
      .substring(0, 500); // Limit length
  }

  /**
   * Validate coordinate (latitude/longitude)
   */
  validateCoordinate(coord: number, type: 'latitude' | 'longitude'): boolean {
    if (type === 'latitude') {
      return coord >= -90 && coord <= 90;
    } else {
      return coord >= -180 && coord <= 180;
    }
  }

  /**
   * Validate Jamaica coordinates (rough bounds)
   */
  validateJamaicaCoordinates(lat: number, lng: number): boolean {
    // Jamaica approximate bounds
    const bounds = {
      north: 18.6,
      south: 17.7,
      east: -76.2,
      west: -78.4
    };
    
    return lat >= bounds.south && 
           lat <= bounds.north && 
           lng >= bounds.west && 
           lng <= bounds.east;
  }

  /**
   * Validate password strength (for admin users)
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize HTML content (basic sanitization)
   */
  sanitizeHtml(html: string): string {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
  }

  /**
   * Validate file upload (basic checks)
   */
  validateFileUpload(file: {
    name: string;
    size: number;
    type: string;
  }, options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default
    const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif'];
    
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
    }
    
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
    }
    
    // Check for potentially dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (dangerousExtensions.includes(fileExtension)) {
      errors.push('File type not allowed for security reasons');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Rate limiting validation
   */
  validateRateLimit(
    identifier: string,
    windowMs: number = 15 * 60 * 1000, // 15 minutes
    maxRequests: number = 100
  ): boolean {
    // This is a simple in-memory rate limiter
    // In production, you'd want to use Redis or similar
    const now = Date.now();
    const key = `rate_limit_${identifier}`;
    
    // Get existing requests from memory (in production, use Redis)
    const requests = this.getRateLimitData(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    // Check if under limit
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.setRateLimitData(key, validRequests);
    
    return true;
  }

  /**
   * Simple in-memory storage for rate limiting
   * In production, replace with Redis
   */
  private rateLimitStore: Map<string, number[]> = new Map();

  private getRateLimitData(key: string): number[] | undefined {
    return this.rateLimitStore.get(key);
  }

  private setRateLimitData(key: string, data: number[]): void {
    this.rateLimitStore.set(key, data);
  }

  /**
   * Validate incident report data
   */
  validateIncidentReport(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!data.incidentType) {
      errors.push('Incident type is required');
    }
    
    if (!data.severity) {
      errors.push('Severity is required');
    }
    
    if (!data.parish || !this.validateParish(data.parish)) {
      errors.push('Valid parish is required');
    }
    
    if (!data.description || data.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters');
    }
    
    if (!data.incidentDate) {
      errors.push('Incident date is required');
    }
    
    if (data.latitude && !this.validateCoordinate(data.latitude, 'latitude')) {
      errors.push('Invalid latitude coordinate');
    }
    
    if (data.longitude && !this.validateCoordinate(data.longitude, 'longitude')) {
      errors.push('Invalid longitude coordinate');
    }
    
    if (data.latitude && data.longitude && 
        !this.validateJamaicaCoordinates(data.latitude, data.longitude)) {
      errors.push('Coordinates must be within Jamaica');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Clean and validate alert message
   */
  validateAlertMessage(message: string): {
    isValid: boolean;
    cleanMessage: string;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!message || message.trim().length === 0) {
      errors.push('Alert message is required');
      return { isValid: false, cleanMessage: '', errors };
    }
    
    let cleanMessage = this.sanitizeText(message);
    
    if (cleanMessage.length < 10) {
      errors.push('Alert message must be at least 10 characters');
    }
    
    if (cleanMessage.length > 500) {
      errors.push('Alert message must be less than 500 characters');
      cleanMessage = cleanMessage.substring(0, 500);
    }
    
    return {
      isValid: errors.length === 0,
      cleanMessage,
      errors
    };
  }

  /**
   * Validate admin login data
   */
  validateAdminLogin(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!data.email || !this.validateEmail(data.email)) {
      errors.push('Valid email is required');
    }
    
    if (!data.password || data.password.length < 1) {
      errors.push('Password is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate admin user creation data
   */
  validateAdminUserCreation(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!data.email || !this.validateEmail(data.email)) {
      errors.push('Valid email is required');
    }
    
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }
    
    if (!data.password) {
      errors.push('Password is required');
    } else {
      const passwordValidation = this.validatePasswordStrength(data.password);
      if (!passwordValidation.isValid) {
        errors.push(...passwordValidation.errors);
      }
    }
    
    if (data.role && !['ADMIN', 'MODERATOR'].includes(data.role)) {
      errors.push('Invalid role specified');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate user profile update data
   */
  validateUserUpdate(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (data.firstName !== undefined) {
      if (!data.firstName || data.firstName.trim().length < 1) {
        errors.push('First name cannot be empty');
      } else if (data.firstName.trim().length > 100) {
        errors.push('First name must be less than 100 characters');
      }
    }
    
    if (data.lastName !== undefined) {
      if (!data.lastName || data.lastName.trim().length < 1) {
        errors.push('Last name cannot be empty');
      } else if (data.lastName.trim().length > 100) {
        errors.push('Last name must be less than 100 characters');
      }
    }
    
    if (data.email !== undefined) {
      if (!this.validateEmail(data.email)) {
        errors.push('Valid email is required');
      }
    }
    
    if (data.phone !== undefined && data.phone !== null && data.phone.trim() !== '') {
      const sanitizedPhone = this.sanitizePhoneNumber(data.phone);
      if (sanitizedPhone.length < 10) {
        errors.push('Phone number must be at least 10 digits');
      }
    }
    
    if (data.parish !== undefined && !this.validateParish(data.parish)) {
      errors.push('Valid parish is required');
    }
    
    if (data.address !== undefined && data.address !== null && data.address.length > 500) {
      errors.push('Address must be less than 500 characters');
    }
    
    if (data.accessibilitySettings !== undefined) {
      if (typeof data.accessibilitySettings !== 'object') {
        errors.push('Accessibility settings must be an object');
      } else {
        const settings = data.accessibilitySettings;
        if (settings.highContrast !== undefined && typeof settings.highContrast !== 'boolean') {
          errors.push('High contrast setting must be a boolean');
        }
        if (settings.largeFont !== undefined && typeof settings.largeFont !== 'boolean') {
          errors.push('Large font setting must be a boolean');
        }
        if (settings.textToSpeech !== undefined && typeof settings.textToSpeech !== 'boolean') {
          errors.push('Text to speech setting must be a boolean');
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create service instance and export convenience functions
const validationService = new ValidationService();

export const validateUserRegistration = (data: any) => {
  const errors: string[] = [];
  
  if (!data.firstName || data.firstName.trim().length < 1) {
    errors.push('First name is required');
  }
  
  if (!data.lastName || data.lastName.trim().length < 1) {
    errors.push('Last name is required');
  }
  
  if (!data.email || !validationService.validateEmail(data.email)) {
    errors.push('Valid email is required');
  }
  
  if (!data.parish || !validationService.validateParish(data.parish)) {
    errors.push('Valid parish is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUserUpdate = (data: any) => validationService.validateUserUpdate(data);
export const validateIncidentReport = (data: any) => validationService.validateIncidentReport(data);
export const validateAlertMessage = (message: string) => validationService.validateAlertMessage(message);
export const validateAdminLogin = (data: any) => validationService.validateAdminLogin(data);
export const validateAdminUserCreation = (data: any) => validationService.validateAdminUserCreation(data);
export const sanitizeText = (text: string) => validationService.sanitizeText(text);
export const sanitizeName = (name: string) => validationService.sanitizeName(name);
export const sanitizeAddress = (address: string) => validationService.sanitizeAddress(address);
export const sanitizePhoneNumber = (phone: string) => validationService.sanitizePhoneNumber(phone);