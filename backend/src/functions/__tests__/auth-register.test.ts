import { registerUser } from '../auth-register';
import { UserService } from '../../services/user.service';
import { EmailService } from '../../services/email.service';
import { ValidationService } from '../../services/validation.service';
import { Parish } from '@prisma/client';
import { HttpRequest, InvocationContext } from '@azure/functions';

// Mock services
jest.mock('../../services/user.service');
jest.mock('../../services/email.service');
jest.mock('../../services/validation.service');

const mockUserService = UserService as jest.MockedClass<typeof UserService>;
const mockEmailService = EmailService as jest.MockedClass<typeof EmailService>;
const mockValidationService = ValidationService as jest.MockedClass<typeof ValidationService>;

describe('registerUser Azure Function', () => {
  let mockContext: InvocationContext;
  let mockRequest: HttpRequest;

  beforeEach(() => {
    // Mock InvocationContext
    mockContext = {
      log: jest.fn(),
    } as any;

    // Mock HttpRequest
    mockRequest = {
      json: jest.fn(),
    } as any;

    // Clear all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockValidationService.prototype.sanitizePhoneNumber = jest.fn().mockImplementation((phone) => phone);
    mockUserService.prototype.findByEmail = jest.fn();
    mockUserService.prototype.create = jest.fn();
    mockEmailService.prototype.sendRegistrationConfirmation = jest.fn();
  });

  const validRegistrationData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+18761234567',
    parish: Parish.KINGSTON,
    address: '123 Main St, Kingston',
    smsAlerts: true,
    emailAlerts: true,
    emergencyOnly: false,
    accessibilitySettings: {
      highContrast: false,
      largeFont: false,
      textToSpeech: false,
    },
  };

  describe('successful registration', () => {
    it('should register a new user successfully', async () => {
      const expectedUser = {
        id: 'test-uuid',
        ...validRegistrationData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      // Setup mocks
      mockRequest.json = jest.fn().mockResolvedValue(validRegistrationData);
      mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(null);
      mockUserService.prototype.create = jest.fn().mockResolvedValue(expectedUser);
      mockEmailService.prototype.sendRegistrationConfirmation = jest.fn().mockResolvedValue(undefined);

      const result = await registerUser(mockRequest, mockContext);

      expect(result.status).toBe(201);
      expect(result.jsonBody).toEqual({
        success: true,
        data: {
          userId: expectedUser.id,
          email: expectedUser.email,
          parish: expectedUser.parish,
        },
        message: 'Registration successful. Please check your email for confirmation.',
      });

      expect(mockUserService.prototype.findByEmail).toHaveBeenCalledWith(validRegistrationData.email);
      expect(mockUserService.prototype.create).toHaveBeenCalledWith(validRegistrationData);
      expect(mockEmailService.prototype.sendRegistrationConfirmation).toHaveBeenCalledWith(expectedUser);
    });

    it('should handle phone number sanitization', async () => {
      const dataWithUnsanitizedPhone = {
        ...validRegistrationData,
        phone: '876-123-4567',
      };

      const sanitizedPhone = '+18761234567';
      const expectedUser = {
        id: 'test-uuid',
        ...dataWithUnsanitizedPhone,
        phone: sanitizedPhone,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      mockRequest.json = jest.fn().mockResolvedValue(dataWithUnsanitizedPhone);
      mockValidationService.prototype.sanitizePhoneNumber = jest.fn().mockReturnValue(sanitizedPhone);
      mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(null);
      mockUserService.prototype.create = jest.fn().mockResolvedValue(expectedUser);
      mockEmailService.prototype.sendRegistrationConfirmation = jest.fn().mockResolvedValue(undefined);

      await registerUser(mockRequest, mockContext);

      expect(mockValidationService.prototype.sanitizePhoneNumber).toHaveBeenCalledWith('876-123-4567');
      expect(mockUserService.prototype.create).toHaveBeenCalledWith({
        ...dataWithUnsanitizedPhone,
        phone: sanitizedPhone,
      });
    });

    it('should continue registration even if email sending fails', async () => {
      const expectedUser = {
        id: 'test-uuid',
        ...validRegistrationData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      mockRequest.json = jest.fn().mockResolvedValue(validRegistrationData);
      mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(null);
      mockUserService.prototype.create = jest.fn().mockResolvedValue(expectedUser);
      mockEmailService.prototype.sendRegistrationConfirmation = jest.fn().mockRejectedValue(new Error('Email service unavailable'));

      const result = await registerUser(mockRequest, mockContext);

      expect(result.status).toBe(201);
      expect(result.jsonBody.success).toBe(true);
      expect(mockContext.log.error).toHaveBeenCalledWith('Failed to send confirmation email:', expect.any(Error));
    });
  });

  describe('validation errors', () => {
    it('should return validation error for missing required fields', async () => {
      const incompleteData = {
        firstName: '',
        email: 'invalid-email',
        parish: 'invalid-parish',
      };

      mockRequest.json = jest.fn().mockResolvedValue(incompleteData);

      const result = await registerUser(mockRequest, mockContext);

      expect(result.status).toBe(400);
      expect(result.jsonBody.success).toBe(false);
      expect(result.jsonBody.error).toBe('Validation failed');
      expect(result.jsonBody.data).toBeInstanceOf(Array);
      expect(result.jsonBody.data.length).toBeGreaterThan(0);
    });

    it('should validate email format', async () => {
      const dataWithInvalidEmail = {
        ...validRegistrationData,
        email: 'invalid-email-format',
      };

      mockRequest.json = jest.fn().mockResolvedValue(dataWithInvalidEmail);

      const result = await registerUser(mockRequest, mockContext);

      expect(result.status).toBe(400);
      expect(result.jsonBody.success).toBe(false);
      expect(result.jsonBody.error).toBe('Validation failed');
    });

    it('should validate parish selection', async () => {
      const dataWithInvalidParish = {
        ...validRegistrationData,
        parish: 'invalid-parish' as any,
      };

      mockRequest.json = jest.fn().mockResolvedValue(dataWithInvalidParish);

      const result = await registerUser(mockRequest, mockContext);

      expect(result.status).toBe(400);
      expect(result.jsonBody.success).toBe(false);
    });

    it('should validate phone number format when provided', async () => {
      const dataWithInvalidPhone = {
        ...validRegistrationData,
        phone: 'invalid-phone-123',
      };

      mockRequest.json = jest.fn().mockResolvedValue(dataWithInvalidPhone);

      const result = await registerUser(mockRequest, mockContext);

      expect(result.status).toBe(400);
      expect(result.jsonBody.success).toBe(false);
    });

    it('should validate string length limits', async () => {
      const dataWithLongStrings = {
        ...validRegistrationData,
        firstName: 'a'.repeat(200),
        lastName: 'b'.repeat(200),
        email: 'c'.repeat(250) + '@example.com',
        address: 'd'.repeat(2000),
      };

      mockRequest.json = jest.fn().mockResolvedValue(dataWithLongStrings);

      const result = await registerUser(mockRequest, mockContext);

      expect(result.status).toBe(400);
      expect(result.jsonBody.success).toBe(false);
    });
  });

  describe('duplicate user handling', () => {
    it('should return error if user already exists', async () => {
      const existingUser = {
        id: 'existing-uuid',
        email: validRegistrationData.email,
        firstName: 'Existing',
        lastName: 'User',
      };

      mockRequest.json = jest.fn().mockResolvedValue(validRegistrationData);
      mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(existingUser);

      const result = await registerUser(mockRequest, mockContext);

      expect(result.status).toBe(400);
      expect(result.jsonBody).toEqual({
        success: false,
        error: 'User with this email already exists',
      });

      expect(mockUserService.prototype.create).not.toHaveBeenCalled();
      expect(mockEmailService.prototype.sendRegistrationConfirmation).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockRequest.json = jest.fn().mockResolvedValue(validRegistrationData);
      mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(null);
      mockUserService.prototype.create = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const result = await registerUser(mockRequest, mockContext);

      expect(result.status).toBe(500);
      expect(result.jsonBody).toEqual({
        success: false,
        error: 'Registration failed. Please try again.',
      });

      expect(mockContext.log.error).toHaveBeenCalledWith('Registration error:', expect.any(Error));
    });

    it('should handle malformed JSON request', async () => {
      mockRequest.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'));

      const result = await registerUser(mockRequest, mockContext);

      expect(result.status).toBe(500);
      expect(result.jsonBody.success).toBe(false);
      expect(result.jsonBody.error).toBe('Registration failed. Please try again.');
    });

    it('should handle service initialization errors', async () => {
      // Mock constructor to throw error
      mockUserService.mockImplementation(() => {
        throw new Error('Service initialization failed');
      });

      mockRequest.json = jest.fn().mockResolvedValue(validRegistrationData);

      const result = await registerUser(mockRequest, mockContext);

      expect(result.status).toBe(500);
      expect(result.jsonBody.success).toBe(false);
    });
  });

  describe('optional fields handling', () => {
    it('should handle registration without optional fields', async () => {
      const minimalData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        parish: Parish.ST_ANDREW,
        smsAlerts: false,
        emailAlerts: true,
        emergencyOnly: false,
      };

      const expectedUser = {
        id: 'test-uuid',
        ...minimalData,
        phone: null,
        address: null,
        accessibilitySettings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      mockRequest.json = jest.fn().mockResolvedValue(minimalData);
      mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(null);
      mockUserService.prototype.create = jest.fn().mockResolvedValue(expectedUser);
      mockEmailService.prototype.sendRegistrationConfirmation = jest.fn().mockResolvedValue(undefined);

      const result = await registerUser(mockRequest, mockContext);

      expect(result.status).toBe(201);
      expect(result.jsonBody.success).toBe(true);
      expect(mockUserService.prototype.create).toHaveBeenCalledWith(minimalData);
    });

    it('should handle empty accessibility settings', async () => {
      const dataWithEmptyAccessibility = {
        ...validRegistrationData,
        accessibilitySettings: undefined,
      };

      const expectedUser = {
        id: 'test-uuid',
        ...dataWithEmptyAccessibility,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      mockRequest.json = jest.fn().mockResolvedValue(dataWithEmptyAccessibility);
      mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(null);
      mockUserService.prototype.create = jest.fn().mockResolvedValue(expectedUser);
      mockEmailService.prototype.sendRegistrationConfirmation = jest.fn().mockResolvedValue(undefined);

      const result = await registerUser(mockRequest, mockContext);

      expect(result.status).toBe(201);
      expect(mockUserService.prototype.create).toHaveBeenCalledWith(dataWithEmptyAccessibility);
    });
  });

  describe('logging', () => {
    it('should log registration request received', async () => {
      mockRequest.json = jest.fn().mockResolvedValue(validRegistrationData);
      mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(null);
      mockUserService.prototype.create = jest.fn().mockResolvedValue({
        id: 'test-uuid',
        ...validRegistrationData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      });
      mockEmailService.prototype.sendRegistrationConfirmation = jest.fn().mockResolvedValue(undefined);

      await registerUser(mockRequest, mockContext);

      expect(mockContext.log).toHaveBeenCalledWith('User registration request received');
    });

    it('should log successful user creation', async () => {
      const expectedUser = {
        id: 'test-uuid',
        ...validRegistrationData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      mockRequest.json = jest.fn().mockResolvedValue(validRegistrationData);
      mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(null);
      mockUserService.prototype.create = jest.fn().mockResolvedValue(expectedUser);
      mockEmailService.prototype.sendRegistrationConfirmation = jest.fn().mockResolvedValue(undefined);

      await registerUser(mockRequest, mockContext);

      expect(mockContext.log).toHaveBeenCalledWith(`User created successfully: ${expectedUser.id}`);
    });

    it('should log email confirmation sent', async () => {
      const expectedUser = {
        id: 'test-uuid',
        ...validRegistrationData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      mockRequest.json = jest.fn().mockResolvedValue(validRegistrationData);
      mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(null);
      mockUserService.prototype.create = jest.fn().mockResolvedValue(expectedUser);
      mockEmailService.prototype.sendRegistrationConfirmation = jest.fn().mockResolvedValue(undefined);

      await registerUser(mockRequest, mockContext);

      expect(mockContext.log).toHaveBeenCalledWith(`Confirmation email sent to: ${expectedUser.email}`);
    });
  });
});