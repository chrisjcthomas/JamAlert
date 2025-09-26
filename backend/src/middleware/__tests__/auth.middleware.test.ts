import { HttpRequest, InvocationContext } from '@azure/functions';
import { requireAdminAuth, requireUserAuth, hasRole, createAuthErrorResponse, createForbiddenResponse } from '../auth.middleware';
import { AuthMiddleware } from '../../lib/auth';
import { AdminService } from '../../services/admin.service';

// Mock dependencies
jest.mock('../../lib/auth');
jest.mock('../../services/admin.service');

const mockAuthMiddleware = AuthMiddleware as jest.Mocked<typeof AuthMiddleware>;
const mockAdminService = AdminService as jest.MockedClass<typeof AdminService>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<HttpRequest>;
  let mockContext: Partial<InvocationContext>;

  beforeEach(() => {
    mockRequest = {
      headers: new Headers(),
    };

    mockContext = {
      log: {
        error: jest.fn(),
      } as any,
    };

    jest.clearAllMocks();
  });

  describe('requireAdminAuth', () => {
    it('should return error if no authorization header', async () => {
      const result = await requireAdminAuth(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(result).toEqual({
        success: false,
        error: 'Authorization header is required'
      });
    });

    it('should return error for invalid token', async () => {
      (mockRequest.headers as Headers).set('Authorization', 'Bearer invalid-token');
      
      mockAuthMiddleware.validateAdminToken.mockResolvedValue(null);

      const result = await requireAdminAuth(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(result).toEqual({
        success: false,
        error: 'Invalid or expired token'
      });
    });

    it('should return error if admin user not found', async () => {
      const tokenPayload = {
        userId: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
        type: 'admin'
      };

      (mockRequest.headers as Headers).set('Authorization', 'Bearer valid-token');
      
      mockAuthMiddleware.validateAdminToken.mockResolvedValue(tokenPayload);

      const mockAdminServiceInstance = {
        getAdminById: jest.fn().mockResolvedValue(null),
      };
      mockAdminService.mockImplementation(() => mockAdminServiceInstance as any);

      const result = await requireAdminAuth(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(result).toEqual({
        success: false,
        error: 'Admin user not found or inactive'
      });
    });

    it('should return error if admin user is inactive', async () => {
      const tokenPayload = {
        userId: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
        type: 'admin'
      };

      const adminUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'ADMIN',
        lastLogin: null,
        createdAt: new Date(),
        isActive: false,
      };

      (mockRequest.headers as Headers).set('Authorization', 'Bearer valid-token');
      
      mockAuthMiddleware.validateAdminToken.mockResolvedValue(tokenPayload);

      const mockAdminServiceInstance = {
        getAdminById: jest.fn().mockResolvedValue(adminUser),
      };
      mockAdminService.mockImplementation(() => mockAdminServiceInstance as any);

      const result = await requireAdminAuth(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(result).toEqual({
        success: false,
        error: 'Admin user not found or inactive'
      });
    });

    it('should return success for valid admin token', async () => {
      const tokenPayload = {
        userId: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
        type: 'admin'
      };

      const adminUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'ADMIN',
        lastLogin: null,
        createdAt: new Date(),
        isActive: true,
      };

      (mockRequest.headers as Headers).set('Authorization', 'Bearer valid-token');
      
      mockAuthMiddleware.validateAdminToken.mockResolvedValue(tokenPayload);

      const mockAdminServiceInstance = {
        getAdminById: jest.fn().mockResolvedValue(adminUser),
      };
      mockAdminService.mockImplementation(() => mockAdminServiceInstance as any);

      const result = await requireAdminAuth(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(result).toEqual({
        success: true,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
          type: 'admin'
        }
      });
    });
  });

  describe('requireUserAuth', () => {
    it('should return error if no authorization header', async () => {
      const result = await requireUserAuth(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(result).toEqual({
        success: false,
        error: 'Authorization header is required'
      });
    });

    it('should return error for invalid token', async () => {
      (mockRequest.headers as Headers).set('Authorization', 'Bearer invalid-token');
      
      mockAuthMiddleware.validateUserToken.mockResolvedValue(null);

      const result = await requireUserAuth(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(result).toEqual({
        success: false,
        error: 'Invalid or expired token'
      });
    });

    it('should return success for valid user token', async () => {
      const tokenPayload = {
        userId: 'user-1',
        email: 'user@test.com',
        type: 'user'
      };

      (mockRequest.headers as Headers).set('Authorization', 'Bearer valid-token');
      
      mockAuthMiddleware.validateUserToken.mockResolvedValue(tokenPayload);

      const result = await requireUserAuth(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(result).toEqual({
        success: true,
        user: {
          id: tokenPayload.userId,
          email: tokenPayload.email,
          role: 'user',
          type: 'user'
        }
      });
    });
  });

  describe('hasRole', () => {
    it('should return false for undefined user', () => {
      const result = hasRole(undefined, 'ADMIN');
      expect(result).toBe(false);
    });

    it('should return true for exact role match', () => {
      const user = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
        type: 'admin' as const
      };

      const result = hasRole(user, 'ADMIN');
      expect(result).toBe(true);
    });

    it('should return true for ADMIN when MODERATOR required', () => {
      const user = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
        type: 'admin' as const
      };

      const result = hasRole(user, 'MODERATOR');
      expect(result).toBe(true);
    });

    it('should return false for MODERATOR when ADMIN required', () => {
      const user = {
        id: 'mod-1',
        email: 'mod@test.com',
        role: 'MODERATOR',
        type: 'admin' as const
      };

      const result = hasRole(user, 'ADMIN');
      expect(result).toBe(false);
    });
  });

  describe('createAuthErrorResponse', () => {
    it('should create auth error response with default status', () => {
      const response = createAuthErrorResponse('Authentication failed');

      expect(response).toEqual({
        status: 401,
        jsonBody: {
          success: false,
          message: 'Authentication failed'
        }
      });
    });

    it('should create auth error response with custom status', () => {
      const response = createAuthErrorResponse('Token expired', 403);

      expect(response).toEqual({
        status: 403,
        jsonBody: {
          success: false,
          message: 'Token expired'
        }
      });
    });
  });

  describe('createForbiddenResponse', () => {
    it('should create forbidden response with default message', () => {
      const response = createForbiddenResponse();

      expect(response).toEqual({
        status: 403,
        jsonBody: {
          success: false,
          message: 'Insufficient permissions'
        }
      });
    });

    it('should create forbidden response with custom message', () => {
      const response = createForbiddenResponse('Admin access required');

      expect(response).toEqual({
        status: 403,
        jsonBody: {
          success: false,
          message: 'Admin access required'
        }
      });
    });
  });
});