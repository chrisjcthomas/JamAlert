import { ValidationService } from '../validation.service';
import { Parish } from '@prisma/client';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('sanitizePhoneNumber', () => {
    it('should format Jamaica phone numbers correctly', () => {
      const testCases = [
        { input: '876-123-4567', expected: '+18761234567' },
        { input: '1876-123-4567', expected: '+18761234567' },
        { input: '+1876-123-4567', expected: '+18761234567' },
        { input: '123-4567', expected: '+18761234567' },
        { input: '(876) 123-4567', expected: '+18761234567' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validationService.sanitizePhoneNumber(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle various phone number formats', () => {
      expect(validationService.sanitizePhoneNumber('876 123 4567')).toBe('+18761234567');
      expect(validationService.sanitizePhoneNumber('876.123.4567')).toBe('+18761234567');
      expect(validationService.sanitizePhoneNumber('18761234567')).toBe('+18761234567');
    });

    it('should preserve international format', () => {
      const international = '+1876123456';
      expect(validationService.sanitizePhoneNumber(international)).toBe(international);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'firstname.lastname@company.com',
      ];

      validEmails.forEach(email => {
        expect(validationService.validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain',
        '',
      ];

      invalidEmails.forEach(email => {
        expect(validationService.validateEmail(email)).toBe(false);
      });
    });
  });

  describe('sanitizeText', () => {
    it('should remove potentially harmful characters', () => {
      const input = '<script>alert("xss")</script>Hello "World"';
      const result = validationService.sanitizeText(input);
      
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('"');
      expect(result).toContain('scriptalert(xss)/scriptHello World');
    });

    it('should trim whitespace and limit length', () => {
      const longText = ' '.repeat(10) + 'a'.repeat(1500) + ' '.repeat(10);
      const result = validationService.sanitizeText(longText);
      
      expect(result.length).toBeLessThanOrEqual(1000);
      expect(result).not.toMatch(/^\s/);
      expect(result).not.toMatch(/\s$/);
    });
  });

  describe('validateParish', () => {
    it('should validate correct parish values', () => {
      Object.values(Parish).forEach(parish => {
        expect(validationService.validateParish(parish)).toBe(true);
      });
    });

    it('should reject invalid parish values', () => {
      const invalidParishes = [
        'invalid_parish',
        'st_andrew_extra',
        '',
      ];

      invalidParishes.forEach(parish => {
        expect(validationService.validateParish(parish as any)).toBe(false);
      });
    });
  });

  describe('sanitizeName', () => {
    it('should allow valid name characters', () => {
      const validNames = [
        "John Doe",
        "Mary-Jane O'Connor",
        "José María",
        "Anne-Marie",
      ];

      validNames.forEach(name => {
        const result = validationService.sanitizeName(name);
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('should remove invalid characters', () => {
      const input = "John123 Doe@#$";
      const result = validationService.sanitizeName(input);
      
      expect(result).toBe("John Doe");
    });

    it('should normalize whitespace', () => {
      const input = "  John    Doe  ";
      const result = validationService.sanitizeName(input);
      
      expect(result).toBe("John Doe");
    });

    it('should limit length', () => {
      const longName = 'a'.repeat(200);
      const result = validationService.sanitizeName(longName);
      
      expect(result.length).toBeLessThanOrEqual(100);
    });
  });

  describe('validateCoordinate', () => {
    it('should validate latitude coordinates', () => {
      expect(validationService.validateCoordinate(0, 'latitude')).toBe(true);
      expect(validationService.validateCoordinate(90, 'latitude')).toBe(true);
      expect(validationService.validateCoordinate(-90, 'latitude')).toBe(true);
      expect(validationService.validateCoordinate(18.1, 'latitude')).toBe(true);
      
      expect(validationService.validateCoordinate(91, 'latitude')).toBe(false);
      expect(validationService.validateCoordinate(-91, 'latitude')).toBe(false);
    });

    it('should validate longitude coordinates', () => {
      expect(validationService.validateCoordinate(0, 'longitude')).toBe(true);
      expect(validationService.validateCoordinate(180, 'longitude')).toBe(true);
      expect(validationService.validateCoordinate(-180, 'longitude')).toBe(true);
      expect(validationService.validateCoordinate(-77.5, 'longitude')).toBe(true);
      
      expect(validationService.validateCoordinate(181, 'longitude')).toBe(false);
      expect(validationService.validateCoordinate(-181, 'longitude')).toBe(false);
    });
  });

  describe('validateJamaicaCoordinates', () => {
    it('should validate coordinates within Jamaica', () => {
      // Kingston coordinates
      expect(validationService.validateJamaicaCoordinates(18.0179, -76.8099)).toBe(true);
      
      // Montego Bay coordinates
      expect(validationService.validateJamaicaCoordinates(18.4762, -77.8939)).toBe(true);
    });

    it('should reject coordinates outside Jamaica', () => {
      // New York coordinates
      expect(validationService.validateJamaicaCoordinates(40.7128, -74.0060)).toBe(false);
      
      // London coordinates
      expect(validationService.validateJamaicaCoordinates(51.5074, -0.1278)).toBe(false);
      
      // Coordinates too far south
      expect(validationService.validateJamaicaCoordinates(17.0, -77.0)).toBe(false);
      
      // Coordinates too far north
      expect(validationService.validateJamaicaCoordinates(19.0, -77.0)).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'MyStr0ng!Pass',
        'C0mpl3x@Password123',
        'S3cur3#P@ssw0rd',
      ];

      strongPasswords.forEach(password => {
        const result = validationService.validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        { password: 'short', expectedErrors: ['at least 8 characters', 'uppercase', 'number', 'special character'] },
        { password: 'nouppercase123!', expectedErrors: ['uppercase'] },
        { password: 'NOLOWERCASE123!', expectedErrors: ['lowercase'] },
        { password: 'NoNumbers!', expectedErrors: ['number'] },
        { password: 'NoSpecialChars123', expectedErrors: ['special character'] },
      ];

      weakPasswords.forEach(({ password, expectedErrors }) => {
        const result = validationService.validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        
        expectedErrors.forEach(errorType => {
          expect(result.errors.some(error => error.includes(errorType))).toBe(true);
        });
      });
    });
  });

  describe('validateIncidentReport', () => {
    const validIncidentData = {
      incidentType: 'flood',
      severity: 'medium',
      parish: Parish.KINGSTON,
      description: 'Heavy flooding on Main Street causing traffic delays',
      incidentDate: new Date().toISOString(),
      latitude: 18.0179,
      longitude: -76.8099,
    };

    it('should validate correct incident report data', () => {
      const result = validationService.validateIncidentReport(validIncidentData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require mandatory fields', () => {
      const incompleteData = {
        // Missing required fields
      };

      const result = validationService.validateIncidentReport(incompleteData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Incident type is required');
      expect(result.errors).toContain('Severity is required');
      expect(result.errors).toContain('Valid parish is required');
      expect(result.errors).toContain('Description must be at least 10 characters');
      expect(result.errors).toContain('Incident date is required');
    });

    it('should validate coordinates', () => {
      const dataWithInvalidCoords = {
        ...validIncidentData,
        latitude: 200, // Invalid latitude
        longitude: -200, // Invalid longitude
      };

      const result = validationService.validateIncidentReport(dataWithInvalidCoords);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid latitude coordinate');
      expect(result.errors).toContain('Invalid longitude coordinate');
    });

    it('should validate Jamaica coordinates', () => {
      const dataWithNonJamaicaCoords = {
        ...validIncidentData,
        latitude: 40.7128, // New York latitude
        longitude: -74.0060, // New York longitude
      };

      const result = validationService.validateIncidentReport(dataWithNonJamaicaCoords);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Coordinates must be within Jamaica');
    });

    it('should validate description length', () => {
      const dataWithShortDescription = {
        ...validIncidentData,
        description: 'Short', // Too short
      };

      const result = validationService.validateIncidentReport(dataWithShortDescription);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Description must be at least 10 characters');
    });
  });

  describe('validateAlertMessage', () => {
    it('should validate correct alert messages', () => {
      const validMessage = 'Heavy rainfall expected in Kingston area. Residents should avoid low-lying areas.';
      
      const result = validationService.validateAlertMessage(validMessage);
      
      expect(result.isValid).toBe(true);
      expect(result.cleanMessage).toBe(validMessage);
      expect(result.errors).toHaveLength(0);
    });

    it('should require message content', () => {
      const emptyMessages = ['', '   ', null, undefined];
      
      emptyMessages.forEach(message => {
        const result = validationService.validateAlertMessage(message as any);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Alert message is required');
      });
    });

    it('should enforce minimum length', () => {
      const shortMessage = 'Short';
      
      const result = validationService.validateAlertMessage(shortMessage);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Alert message must be at least 10 characters');
    });

    it('should enforce maximum length', () => {
      const longMessage = 'a'.repeat(600);
      
      const result = validationService.validateAlertMessage(longMessage);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Alert message must be less than 500 characters');
      expect(result.cleanMessage.length).toBe(500);
    });

    it('should sanitize message content', () => {
      const messageWithHtml = 'Alert: <script>alert("xss")</script> Heavy rain expected';
      
      const result = validationService.validateAlertMessage(messageWithHtml);
      
      expect(result.cleanMessage).not.toContain('<script>');
      expect(result.cleanMessage).not.toContain('</script>');
    });
  });

  describe('validateFileUpload', () => {
    it('should validate correct file uploads', () => {
      const validFile = {
        name: 'image.jpg',
        size: 1024 * 1024, // 1MB
        type: 'image/jpeg',
      };

      const result = validationService.validateFileUpload(validFile);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject files that are too large', () => {
      const largeFile = {
        name: 'large-image.jpg',
        size: 10 * 1024 * 1024, // 10MB
        type: 'image/jpeg',
      };

      const result = validationService.validateFileUpload(largeFile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File size must be less than 5MB');
    });

    it('should reject invalid file types', () => {
      const invalidFile = {
        name: 'document.pdf',
        size: 1024,
        type: 'application/pdf',
      };

      const result = validationService.validateFileUpload(invalidFile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('File type must be one of'))).toBe(true);
    });

    it('should reject dangerous file extensions', () => {
      const dangerousFile = {
        name: 'malware.exe',
        size: 1024,
        type: 'application/octet-stream',
      };

      const result = validationService.validateFileUpload(dangerousFile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File type not allowed for security reasons');
    });

    it('should respect custom options', () => {
      const file = {
        name: 'document.pdf',
        size: 1024,
        type: 'application/pdf',
      };

      const options = {
        maxSize: 2 * 1024 * 1024, // 2MB
        allowedTypes: ['application/pdf', 'text/plain'],
      };

      const result = validationService.validateFileUpload(file, options);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateAdminLogin', () => {
    it('should validate correct admin login data', () => {
      const validLoginData = {
        email: 'admin@test.com',
        password: 'password123',
      };

      const result = validationService.validateAdminLogin(validLoginData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require valid email', () => {
      const invalidEmailData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const result = validationService.validateAdminLogin(invalidEmailData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid email is required');
    });

    it('should require password', () => {
      const noPasswordData = {
        email: 'admin@test.com',
        password: '',
      };

      const result = validationService.validateAdminLogin(noPasswordData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('should require both email and password', () => {
      const emptyData = {};

      const result = validationService.validateAdminLogin(emptyData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid email is required');
      expect(result.errors).toContain('Password is required');
    });
  });

  describe('validateAdminUserCreation', () => {
    it('should validate correct admin user creation data', () => {
      const validData = {
        email: 'admin@test.com',
        name: 'Test Admin',
        password: 'StrongP@ssw0rd123',
        role: 'ADMIN',
      };

      const result = validationService.validateAdminUserCreation(validData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require valid email', () => {
      const invalidEmailData = {
        email: 'invalid-email',
        name: 'Test Admin',
        password: 'StrongP@ssw0rd123',
      };

      const result = validationService.validateAdminUserCreation(invalidEmailData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid email is required');
    });

    it('should require name with minimum length', () => {
      const shortNameData = {
        email: 'admin@test.com',
        name: 'A',
        password: 'StrongP@ssw0rd123',
      };

      const result = validationService.validateAdminUserCreation(shortNameData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name must be at least 2 characters');
    });

    it('should require strong password', () => {
      const weakPasswordData = {
        email: 'admin@test.com',
        name: 'Test Admin',
        password: 'weak',
      };

      const result = validationService.validateAdminUserCreation(weakPasswordData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('Password must'))).toBe(true);
    });

    it('should validate role if provided', () => {
      const invalidRoleData = {
        email: 'admin@test.com',
        name: 'Test Admin',
        password: 'StrongP@ssw0rd123',
        role: 'INVALID_ROLE',
      };

      const result = validationService.validateAdminUserCreation(invalidRoleData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid role specified');
    });

    it('should accept valid roles', () => {
      const validRoles = ['ADMIN', 'MODERATOR'];

      validRoles.forEach(role => {
        const data = {
          email: 'admin@test.com',
          name: 'Test Admin',
          password: 'StrongP@ssw0rd123',
          role,
        };

        const result = validationService.validateAdminUserCreation(data);
        expect(result.isValid).toBe(true);
      });
    });
  });
});