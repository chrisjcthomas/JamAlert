import { HttpRequest, InvocationContext } from '@azure/functions';
import { adminIncidents } from '../admin-incidents';
import { DashboardService } from '../../services/dashboard.service';
import { requireAdminAuth, hasRole } from '../../middleware/auth.middleware';
import { Parish, ReportStatus, Severity, IncidentType } from '@prisma/client';

// Mock dependencies
jest.mock('../../services/dashboard.service');
jest.mock('../../middleware/auth.middleware');

const mockDashboardService = DashboardService as jest.MockedClass<typeof DashboardService>;
const mockRequireAdminAuth = requireAdminAuth as jest.MockedFunction<typeof requireAdminAuth>;
const mockHasRole = hasRole as jest.MockedFunction<typeof hasRole>;

describe('adminIncidents', () => {
  let mockContext: any;
  let mockDashboardServiceInstance: jest.Mocked<DashboardService>;

  beforeEach(() => {
    mockContext = {
      log: jest.fn(),
      executionContext: {
        invocationId: 'test-id',
        functionName: 'admin-incidents',
        functionDirectory: '/test'
      }
    };

    // Ensure v4 logging methods exist
    (mockContext as any).error = jest.fn();
    (mockContext as any).warn = jest.fn();


    mockDashboardServiceInstance = {
      getIncidentReports: jest.fn(),
      updateIncidentStatus: jest.fn(),
    } as any;

    mockDashboardService.mockImplementation(() => mockDashboardServiceInstance);

    jest.clearAllMocks();
  });

  describe('GET /api/admin/incidents', () => {
    it('should return paginated incident reports for authenticated admin', async () => {
      const mockRequest: Partial<HttpRequest> = {
        method: 'GET',
        url: 'https://example.com/api/admin/incidents?page=1&limit=10&parish=KINGSTON&status=PENDING',
        headers: new Headers([['Authorization', 'Bearer valid-token']])
      };

      const mockReports = [
        {
          id: '1',
          incidentType: IncidentType.FLOOD,
          severity: Severity.HIGH,
          parish: Parish.KINGSTON,
          description: 'Test incident',
          status: ReportStatus.PENDING,
          createdAt: new Date()
        }
      ];

      const mockResult = {
        reports: mockReports,
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

      mockDashboardServiceInstance.getIncidentReports.mockResolvedValue(mockResult as any);

      const response = await adminIncidents(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(200);
      expect((response as any).jsonBody).toEqual({
        success: true,
        data: mockReports,
        pagination: mockResult.pagination
      });

      expect(mockDashboardServiceInstance.getIncidentReports).toHaveBeenCalledWith(
        1, 10, { parish: Parish.KINGSTON, status: ReportStatus.PENDING }
      );
    });

    it('should apply all filters correctly', async () => {
      const mockRequest: Partial<HttpRequest> = {
        method: 'GET',
        url: 'https://example.com/api/admin/incidents?parish=ST_ANDREW&status=APPROVED&incidentType=FLOOD&severity=HIGH&dateFrom=2024-01-01&dateTo=2024-12-31',
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

      mockDashboardServiceInstance.getIncidentReports.mockResolvedValue({
        reports: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      } as any);

      await adminIncidents(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(mockDashboardServiceInstance.getIncidentReports).toHaveBeenCalledWith(
        1, 20, {
          parish: Parish.ST_ANDREW,
          status: ReportStatus.APPROVED,
          incidentType: IncidentType.FLOOD,
          severity: Severity.HIGH,
          dateFrom: new Date('2024-01-01'),
          dateTo: new Date('2024-12-31')
        }
      );
    });

    it('should ignore invalid filter values', async () => {
      const mockRequest: Partial<HttpRequest> = {
        method: 'GET',
        url: 'https://example.com/api/admin/incidents?parish=INVALID&status=INVALID&severity=INVALID',
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

      mockDashboardServiceInstance.getIncidentReports.mockResolvedValue({
        reports: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      } as any);

      await adminIncidents(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(mockDashboardServiceInstance.getIncidentReports).toHaveBeenCalledWith(
        1, 20, {} // No filters applied for invalid values
      );
    });
  });

  describe('PUT /api/admin/incidents/{reportId}/approve', () => {
    it('should approve incident report for moderator or admin', async () => {
      const mockRequest: Partial<HttpRequest> = {
        method: 'PUT',
        url: 'https://example.com/api/admin/incidents/report-123/approve',
        headers: new Headers([['Authorization', 'Bearer valid-token']])
      };

      const mockReport = {
        id: 'report-123',
        status: ReportStatus.APPROVED,
        updatedAt: new Date()
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

      mockHasRole.mockReturnValue(true);
      mockDashboardServiceInstance.updateIncidentStatus.mockResolvedValue(mockReport as any);

      const response = await adminIncidents(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(200);
      expect((response as any).jsonBody).toEqual({
        success: true,
        message: 'Incident report approved successfully',
        data: {
          id: mockReport.id,
          status: mockReport.status,
          updatedAt: mockReport.updatedAt
        }
      });

      expect(mockDashboardServiceInstance.updateIncidentStatus).toHaveBeenCalledWith(
        'report-123', ReportStatus.APPROVED, 'admin-1'
      );
    });

    it('should reject incident report', async () => {
      const mockRequest: Partial<HttpRequest> = {
        method: 'PUT',
        url: 'https://example.com/api/admin/incidents/report-123/reject',
        headers: new Headers([['Authorization', 'Bearer valid-token']])
      };

      const mockReport = {
        id: 'report-123',
        status: ReportStatus.REJECTED,
        updatedAt: new Date()
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
      mockDashboardServiceInstance.updateIncidentStatus.mockResolvedValue(mockReport as any);

      const response = await adminIncidents(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(200);
      expect((response as any).jsonBody).toEqual({
        success: true,
        message: 'Incident report rejected successfully',
        data: {
          id: mockReport.id,
          status: mockReport.status,
          updatedAt: mockReport.updatedAt
        }
      });

      expect(mockDashboardServiceInstance.updateIncidentStatus).toHaveBeenCalledWith(
        'report-123', ReportStatus.REJECTED, 'admin-1'
      );
    });

    it('should resolve incident report', async () => {
      const mockRequest: Partial<HttpRequest> = {
        method: 'PUT',
        url: 'https://example.com/api/admin/incidents/report-123/resolve',
        headers: new Headers([['Authorization', 'Bearer valid-token']])
      };

      const mockReport = {
        id: 'report-123',
        status: ReportStatus.RESOLVED,
        updatedAt: new Date()
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
      mockDashboardServiceInstance.updateIncidentStatus.mockResolvedValue(mockReport as any);

      const response = await adminIncidents(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(200);
      expect((response as any).jsonBody).toEqual({
        success: true,
        message: 'Incident marked as resolved successfully',
        data: {
          id: mockReport.id,
          status: mockReport.status,
          updatedAt: mockReport.updatedAt
        }
      });

      expect(mockDashboardServiceInstance.updateIncidentStatus).toHaveBeenCalledWith(
        'report-123', ReportStatus.RESOLVED, 'admin-1'
      );
    });

    it('should return 403 for users without moderator role', async () => {
      const mockRequest: Partial<HttpRequest> = {
        method: 'PUT',
        url: 'https://example.com/api/admin/incidents/report-123/approve',
        headers: new Headers([['Authorization', 'Bearer valid-token']])
      };

      mockRequireAdminAuth.mockResolvedValue({
        success: true,
        user: {
          id: 'user-1',
          email: 'user@example.com',
          role: 'USER',
          type: 'admin'
        }
      });

      mockHasRole.mockReturnValue(false);

      const response = await adminIncidents(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(403);
      expect((response as any).jsonBody).toEqual({
        success: false,
        message: 'Moderator role or higher required for incident management'
      });

      expect(mockDashboardServiceInstance.updateIncidentStatus).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid action', async () => {
      const mockRequest: Partial<HttpRequest> = {
        method: 'PUT',
        url: 'https://example.com/api/admin/incidents/report-123/invalid-action',
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

      const response = await adminIncidents(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(400);
      expect((response as any).jsonBody).toEqual({
        success: false,
        message: 'Invalid action. Supported actions: approve, reject, resolve'
      });
    });

    it('should return 400 for invalid URL format', async () => {
      const mockRequest: Partial<HttpRequest> = {
        method: 'PUT',
        url: 'https://example.com/api/admin/incidents/invalid-format',
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

      const response = await adminIncidents(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(400);
      expect((response as any).jsonBody).toEqual({
        success: false,
        message: 'Invalid URL format. Expected: /api/admin/incidents/{reportId}/{action}'
      });
    });

    it('should return 404 for incident not found', async () => {
      const mockRequest: Partial<HttpRequest> = {
        method: 'PUT',
        url: 'https://example.com/api/admin/incidents/nonexistent/approve',
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
      mockDashboardServiceInstance.updateIncidentStatus.mockRejectedValue(new Error('Incident not found'));

      const response = await adminIncidents(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(404);
      expect((response as any).jsonBody).toEqual({
        success: false,
        message: 'Incident report not found'
      });
    });
  });

  it('should return 401 for unauthenticated request', async () => {
    const mockRequest: Partial<HttpRequest> = {
      method: 'GET',
      url: 'https://example.com/api/admin/incidents',
      headers: new Headers()
    };

    mockRequireAdminAuth.mockResolvedValue({
      success: false,
      error: 'No authorization header'
    });

    const response = await adminIncidents(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(401);
    expect((response as any).jsonBody).toEqual({
      success: false,
      message: 'No authorization header'
    });
  });

  it('should return 405 for unsupported methods', async () => {
    const mockRequest: Partial<HttpRequest> = {
      method: 'DELETE',
      url: 'https://example.com/api/admin/incidents',
      headers: new Headers([['Authorization', 'Bearer valid-token']])
    };

    const response = await adminIncidents(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(405);
    expect((response as any).jsonBody).toEqual({
      success: false,
      message: 'Method not allowed'
    });
  });
});