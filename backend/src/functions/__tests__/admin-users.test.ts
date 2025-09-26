import { HttpRequest, InvocationContext } from '@azure/functions';
import { adminUsers } from '../admin-users';
import { DashboardService } from '../../services/dashboard.service';
import { requireAdminAuth, hasRole } from '../../middleware/auth.middleware';
import { Parish } from '@prisma/client';

// Mock dependencies
jest.mock('../../services/dashboard.service');
jest.mock('../../middleware/auth.middleware');

const mockDashboardService = DashboardService as jest.MockedClass<typeof DashboardService>;
const mockRequireAdminAuth = requireAdminAuth as jest.MockedFunction<typeof requireAdminAuth>;
const mockHasRole = hasRole as jest.MockedFunction<typeof hasRole>;

describe('adminUsers', () => {
  let mockContext: any;
  let mockDashboardServiceInstance: jest.Mocked<DashboardService>;

  beforeEach(() => {
    mockContext = {
      log: jest.fn(),
      executionContext: {
        invocationId: 'test-id',
        functionName: 'admin-users',
        functionDirectory: '/test'
      }
    };

    // Ensure v4 logging methods exist
    (mockContext as any).error = jest.fn();
    (mockContext as any).warn = jest.fn();


    mockDashboardServiceInstance = {
      getUsers: jest.fn(),
      deactivateUser: jest.fn(),
      reactivateUser: jest.fn(),
    } as any;

    mockDashboardService.mockImplementation(() => mockDashboardServiceInstance);

    jest.clearAllMocks();
  });

  describe('GET /api/admin/users', () => {
    it('should return paginated users for authenticated admin', async () => {
      const mockRequest: Partial<HttpRequest> = {
        method: 'GET',
        url: 'https://example.com/api/admin/users?page=1&limit=10&parish=KINGSTON',
        headers: new Headers([['Authorization', 'Bearer valid-token']])
      };

      const mockUsers = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          parish: Parish.KINGSTON,
          isActive: true,
          createdAt: new Date()
        }
      ];

      const mockResult = {
        users: mockUsers,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      };

      mockRequireAdminAuth.mockResolvedValue({
        success: true,
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'ADMIN',
          type: 'admin'
        }
      });

      mockDashboardServiceInstance.getUsers.mockResolvedValue(mockResult as any);

      const response = await adminUsers(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(200);
      expect((response as any).jsonBody).toEqual({
        success: true,
        data: mockUsers,
        pagination: mockResult.pagination
      });

      expect(mockDashboardServiceInstance.getUsers).toHaveBeenCalledWith(
        1, 10, { parish: Parish.KINGSTON }
      );
    });

    it('should apply search filter correctly', async () => {
      const mockRequest: Partial<HttpRequest> = {
        method: 'GET',
        url: 'https://example.com/api/admin/users?search=john&isActive=true',
        headers: new Headers([['Authorization', 'Bearer valid-token']])
      };

      mockRequireAdminAuth.mockResolvedValue({
        success: true,
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'ADMIN',
          type: 'admin'
        }
      });

      mockDashboardServiceInstance.getUsers.mockResolvedValue({
        users: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      } as any);

      await adminUsers(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(mockDashboardServiceInstance.getUsers).toHaveBeenCalledWith(
        1, 20, { search: 'john', isActive: true }
      );
    });

    it('should limit page size to maximum of 100', async () => {
      const mockRequest: Partial<HttpRequest> = {
        method: 'GET',
        url: 'https://example.com/api/admin/users?limit=500',
        headers: new Headers([['Authorization', 'Bearer valid-token']])
      };

      mockRequireAdminAuth.mockResolvedValue({
        success: true,
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'ADMIN',
          type: 'admin'
        }
      });

      mockDashboardServiceInstance.getUsers.mockResolvedValue({
        users: [],
        pagination: { page: 1, limit: 100, total: 0, totalPages: 0 }
      } as any);

      await adminUsers(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(mockDashboardServiceInstance.getUsers).toHaveBeenCalledWith(
        1, 100, {}
      );
    });
  });

  describe('PUT /api/admin/users/{userId}/deactivate', () => {
    it('should deactivate user for admin with proper role', async () => {
      const mockRequest: Partial<HttpRequest> = {
        method: 'PUT',
        url: 'https://example.com/api/admin/users/user-123/deactivate',
        headers: new Headers([['Authorization', 'Bearer valid-token']])
      };

      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        isActive: false
      };

      mockRequireAdminAuth.mockResolvedValue({
        success: true,
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'ADMIN',
          type: 'admin'
        }
      });

      mockHasRole.mockReturnValue(true);
      mockDashboardServiceInstance.deactivateUser.mockResolvedValue(mockUser as any);

      const response = await adminUsers(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(200);
      expect((response as any).jsonBody).toEqual({
        success: true,
        message: 'User deactivated successfully',
        data: mockUser
      });

      expect(mockDashboardServiceInstance.deactivateUser).toHaveBeenCalledWith('user-123', 'admin-1');
    });

    it('should return 403 for non-admin users', async () => {
      const mockRequest: Partial<HttpRequest> = {
        method: 'PUT',
        url: 'https://example.com/api/admin/users/user-123/deactivate',
        headers: new Headers([['Authorization', 'Bearer valid-token']])
      };

      mockRequireAdminAuth.mockResolvedValue({
        success: true,
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'MODERATOR',
          type: 'admin'
        }
      });

      mockHasRole.mockReturnValue(false);

      const response = await adminUsers(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(403);
      expect((response as any).jsonBody).toEqual({
        success: false,
        message: 'Admin role required for user management'
      });

      expect(mockDashboardServiceInstance.deactivateUser).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/admin/users/{userId}/reactivate', () => {
    it('should reactivate user for admin with proper role', async () => {
      const mockRequest: Partial<HttpRequest> = {
        method: 'PUT',
        url: 'https://example.com/api/admin/users/user-123/reactivate',
        headers: new Headers([['Authorization', 'Bearer valid-token']])
      };

      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        isActive: true
      };

      mockRequireAdminAuth.mockResolvedValue({
        success: true,
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'ADMIN',
          type: 'admin'
        }
      });

      mockHasRole.mockReturnValue(true);
      mockDashboardServiceInstance.reactivateUser.mockResolvedValue(mockUser as any);

      const response = await adminUsers(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(200);
      expect((response as any).jsonBody).toEqual({
        success: true,
        message: 'User reactivated successfully',
        data: mockUser
      });

      expect(mockDashboardServiceInstance.reactivateUser).toHaveBeenCalledWith('user-123', 'admin-1');
    });
  });

  it('should return 400 for invalid URL format', async () => {
    const mockRequest: Partial<HttpRequest> = {
      method: 'PUT',
      url: 'https://example.com/api/admin/users/invalid-format',
      headers: new Headers([['Authorization', 'Bearer valid-token']])
    };

    mockRequireAdminAuth.mockResolvedValue({
      success: true,
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'ADMIN',
        type: 'admin'
      }
    });

    mockHasRole.mockReturnValue(true);

    const response = await adminUsers(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(400);
    expect((response as any).jsonBody).toEqual({
      success: false,
      message: 'Invalid URL format. Expected: /api/admin/users/{userId}/{action}'
    });
  });

  it('should return 400 for invalid action', async () => {
    const mockRequest: Partial<HttpRequest> = {
      method: 'PUT',
      url: 'https://example.com/api/admin/users/user-123/invalid-action',
      headers: new Headers([['Authorization', 'Bearer valid-token']])
    };

    mockRequireAdminAuth.mockResolvedValue({
      success: true,
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'ADMIN',
        type: 'admin'
      }
    });

    mockHasRole.mockReturnValue(true);

    const response = await adminUsers(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(400);
    expect((response as any).jsonBody).toEqual({
      success: false,
      message: 'Invalid action. Supported actions: deactivate, reactivate'
    });
  });

  it('should return 404 for user not found', async () => {
    const mockRequest: Partial<HttpRequest> = {
      method: 'PUT',
      url: 'https://example.com/api/admin/users/nonexistent/deactivate',
      headers: new Headers([['Authorization', 'Bearer valid-token']])
    };

    mockRequireAdminAuth.mockResolvedValue({
      success: true,
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'ADMIN',
        type: 'admin'
      }
    });

    mockHasRole.mockReturnValue(true);
    mockDashboardServiceInstance.deactivateUser.mockRejectedValue(new Error('User not found'));

    const response = await adminUsers(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(404);
    expect((response as any).jsonBody).toEqual({
      success: false,
      message: 'User not found'
    });
  });

  it('should return 401 for unauthenticated request', async () => {
    const mockRequest: Partial<HttpRequest> = {
      method: 'GET',
      url: 'https://example.com/api/admin/users',
      headers: new Headers()
    };

    mockRequireAdminAuth.mockResolvedValue({
      success: false,
      error: 'No authorization header'
    });

    const response = await adminUsers(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(401);
    expect((response as any).jsonBody).toEqual({
      success: false,
      message: 'No authorization header'
    });
  });

  it('should return 405 for unsupported methods', async () => {
    const mockRequest: Partial<HttpRequest> = {
      method: 'DELETE',
      url: 'https://example.com/api/admin/users',
      headers: new Headers([['Authorization', 'Bearer valid-token']])
    };

    const response = await adminUsers(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(405);
    expect((response as any).jsonBody).toEqual({
      success: false,
      message: 'Method not allowed'
    });
  });
});