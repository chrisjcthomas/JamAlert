import { HttpRequest, InvocationContext } from '@azure/functions';
import { adminDashboard } from '../admin-dashboard';
import { DashboardService } from '../../services/dashboard.service';
import { requireAdminAuth } from '../../middleware/auth.middleware';

// Mock dependencies
jest.mock('../../services/dashboard.service');
jest.mock('../../middleware/auth.middleware');

const mockDashboardService = DashboardService as jest.MockedClass<typeof DashboardService>;
const mockRequireAdminAuth = requireAdminAuth as jest.MockedFunction<typeof requireAdminAuth>;

describe('adminDashboard', () => {
  let mockRequest: Partial<HttpRequest>;
  let mockContext: any;
  let mockDashboardServiceInstance: jest.Mocked<DashboardService>;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      url: 'https://example.com/api/admin/dashboard',
      headers: new Headers([['Authorization', 'Bearer valid-token']])
    };

    mockContext = {
      log: jest.fn(),
      executionContext: {
        invocationId: 'test-id',
        functionName: 'admin-dashboard',
        functionDirectory: '/test'
      }
    };

    // Ensure v4 logging methods exist
    (mockContext as any).error = jest.fn();
    (mockContext as any).warn = jest.fn();


    mockDashboardServiceInstance = {
      getDashboardStats: jest.fn(),
    } as any;

    mockDashboardService.mockImplementation(() => mockDashboardServiceInstance);

    jest.clearAllMocks();
  });

  it('should return dashboard stats for authenticated admin', async () => {
    const mockStats = {
      userCount: 150,
      activeAlerts: 5,
      reportsToday: 12,
      systemHealth: {
        database: { status: 'healthy' as const, latency: 50 },
        weather: { status: 'healthy' as const },
        notifications: { status: 'healthy' as const }
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

    mockDashboardServiceInstance.getDashboardStats.mockResolvedValue(mockStats);

    const response = await adminDashboard(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(200);
    expect((response as any).jsonBody).toEqual({
      success: true,
      data: mockStats
    });

    expect(mockRequireAdminAuth).toHaveBeenCalledWith(mockRequest, mockContext);
    expect(mockDashboardServiceInstance.getDashboardStats).toHaveBeenCalled();
  });

  it('should return 401 for unauthenticated request', async () => {
    mockRequireAdminAuth.mockResolvedValue({
      success: false,
      error: 'Invalid token'
    });

    const response = await adminDashboard(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(401);
    expect((response as any).jsonBody).toEqual({
      success: false,
      message: 'Invalid token'
    });

    expect(mockDashboardServiceInstance.getDashboardStats).not.toHaveBeenCalled();
  });

  it('should return 405 for non-GET methods', async () => {
    const postRequest = { ...(mockRequest as any), method: 'POST' } as HttpRequest;

    const response = await adminDashboard(postRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(405);
    expect((response as any).jsonBody).toEqual({
      success: false,
      message: 'Method not allowed'
    });

    expect(mockRequireAdminAuth).not.toHaveBeenCalled();
  });

  it('should return 500 for service errors', async () => {
    mockRequireAdminAuth.mockResolvedValue({
      success: true,
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'ADMIN',
        type: 'admin'
      }
    });

    mockDashboardServiceInstance.getDashboardStats.mockRejectedValue(new Error('Database error'));

    const response = await adminDashboard(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(500);
    expect((response as any).jsonBody).toEqual({
      success: false,
      message: 'Internal server error'
    });
  });

  it('should handle authentication without error message', async () => {
    mockRequireAdminAuth.mockResolvedValue({
      success: false
    });

    const response = await adminDashboard(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(401);
    expect((response as any).jsonBody).toEqual({
      success: false,
      message: 'Authentication required'
    });
  });
});