import { HttpRequest, InvocationContext } from '@azure/functions';
import { authLogin } from '../auth-login';
import { AdminService } from '../../services/admin.service';
import { AuthMiddleware } from '../../lib/auth';
import { ValidationService } from '../../services/validation.service';

// Mock dependencies
jest.mock('../../services/admin.service');
jest.mock('../../lib/auth');
jest.mock('../../services/validation.service');

const mockAdminService = AdminService as jest.MockedClass<typeof AdminService>;
const mockAuthMiddleware = AuthMiddleware as jest.Mocked<typeof AuthMiddleware>;
const mockValidationService = ValidationService as jest.Mocked<typeof ValidationService>;

describe('authLogin', () => {
  let mockRequest: Partial<HttpRequest>;
  let mockContext: Partial<InvocationContext>;

  beforeEach(() => {
    mockContext = {
      log: jest.fn() as any,
    };

    jest.clearAllMocks();
  });

  it('should return 405 for non-POST requests', async () => {
    mockRequest = {
      method: 'GET',
    };

    const response = await authLogin(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(405);
    expect(response.jsonBody).toEqual({
      success: false,
      message: 'Method not allowed'
    });
  });

  it('should return 400 for invalid JSON', async () => {
    mockRequest = {
      method: 'POST',
      text: jest.fn().mockResolvedValue('invalid json'),
    };

    const response = await authLogin(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(400);
    expect(response.jsonBody).toEqual({
      success: false,
      message: 'Invalid JSON in request body'
    });
  });

  it('should return 400 for validation errors', async () => {
    const loginData = {
      email: 'invalid-email',
      password: '',
    };

    mockRequest = {
      method: 'POST',
      text: jest.fn().mockResolvedValue(JSON.stringify(loginData)),
    };

    mockValidationService.validateAdminLogin.mockReturnValue({
      isValid: false,
      errors: ['Valid email is required', 'Password is required']
    });

    const response = await authLogin(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(400);
    expect(response.jsonBody).toEqual({
      success: false,
      message: 'Validation failed',
      errors: ['Valid email is required', 'Password is required']
    });
  });

  it('should return 401 for invalid credentials', async () => {
    const loginData = {
      email: 'admin@test.com',
      password: 'wrongpassword',
    };

    mockRequest = {
      method: 'POST',
      text: jest.fn().mockResolvedValue(JSON.stringify(loginData)),
    };

    mockValidationService.validateAdminLogin.mockReturnValue({
      isValid: true,
      errors: []
    });

    const mockAdminServiceInstance = {
      authenticateAdmin: jest.fn().mockResolvedValue(null),
    };
    mockAdminService.mockImplementation(() => mockAdminServiceInstance as any);

    const response = await authLogin(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(mockAdminServiceInstance.authenticateAdmin).toHaveBeenCalledWith({
      email: loginData.email,
      password: loginData.password
    });
    expect(response.status).toBe(401);
    expect(response.jsonBody).toEqual({
      success: false,
      message: 'Invalid email or password'
    });
  });

  it('should return 200 with token for valid credentials', async () => {
    const loginData = {
      email: 'admin@test.com',
      password: 'correctpassword',
    };

    const adminUser = {
      id: 'admin-1',
      email: 'admin@test.com',
      name: 'Test Admin',
      role: 'ADMIN',
      lastLogin: new Date(),
      createdAt: new Date(),
      isActive: true,
    };

    const mockToken = 'jwt-token-123';

    mockRequest = {
      method: 'POST',
      text: jest.fn().mockResolvedValue(JSON.stringify(loginData)),
    };

    mockValidationService.validateAdminLogin.mockReturnValue({
      isValid: true,
      errors: []
    });

    const mockAdminServiceInstance = {
      authenticateAdmin: jest.fn().mockResolvedValue(adminUser),
    };
    mockAdminService.mockImplementation(() => mockAdminServiceInstance as any);

    mockAuthMiddleware.generateAdminToken.mockReturnValue(mockToken);

    const response = await authLogin(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(mockAdminServiceInstance.authenticateAdmin).toHaveBeenCalledWith({
      email: loginData.email,
      password: loginData.password
    });
    expect(mockAuthMiddleware.generateAdminToken).toHaveBeenCalledWith({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    });
    expect(response.status).toBe(200);
    expect(response.jsonBody).toEqual({
      success: true,
      token: mockToken,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      }
    });
  });

  it('should return 500 for server errors', async () => {
    const loginData = {
      email: 'admin@test.com',
      password: 'password',
    };

    mockRequest = {
      method: 'POST',
      text: jest.fn().mockResolvedValue(JSON.stringify(loginData)),
    };

    mockValidationService.validateAdminLogin.mockReturnValue({
      isValid: true,
      errors: []
    });

    const mockAdminServiceInstance = {
      authenticateAdmin: jest.fn().mockRejectedValue(new Error('Database error')),
    };
    mockAdminService.mockImplementation(() => mockAdminServiceInstance as any);

    const response = await authLogin(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(500);
    expect(response.jsonBody).toEqual({
      success: false,
      message: 'Internal server error'
    });
  });
});