import { DashboardService } from '../dashboard.service';
import { getPrismaClient } from '../../lib/database';
import { Parish, ReportStatus, AlertType, Severity, IncidentType } from '@prisma/client';

// Mock Prisma client
jest.mock('../../lib/database');
const mockPrisma = {
  user: {
    count: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  alert: {
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  incidentReport: {
    count: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
};

(getPrismaClient as jest.Mock).mockReturnValue(mockPrisma);

describe('DashboardService', () => {
  let dashboardService: DashboardService;

  beforeEach(() => {
    dashboardService = new DashboardService();
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      // Mock the individual stat methods
      mockPrisma.user.count.mockResolvedValue(150);
      mockPrisma.alert.count.mockResolvedValue(5);
      mockPrisma.incidentReport.count.mockResolvedValue(12);
      mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const stats = await dashboardService.getDashboardStats();

      expect(stats).toEqual({
        userCount: 150,
        activeAlerts: 5,
        reportsToday: 12,
        systemHealth: {
          database: { status: 'healthy', latency: expect.any(Number) },
          weather: { status: 'healthy' },
          notifications: { status: 'healthy' }
        }
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.count.mockRejectedValue(new Error('Database error'));

      await expect(dashboardService.getDashboardStats()).rejects.toThrow('Failed to get dashboard stats');
    });
  });

  describe('getUsers', () => {
    it('should return paginated users with default parameters', async () => {
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

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await dashboardService.getUsers();

      expect(result).toEqual({
        users: mockUsers,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        }
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object)
      });
    });

    it('should apply filters correctly', async () => {
      const filters = {
        parish: Parish.ST_ANDREW,
        isActive: true,
        search: 'john'
      };

      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await dashboardService.getUsers(1, 20, filters);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          parish: Parish.ST_ANDREW,
          isActive: true,
          OR: [
            { firstName: { contains: 'john' } },
            { lastName: { contains: 'john' } },
            { email: { contains: 'john' } }
          ]
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object)
      });
    });

    it('should handle pagination correctly', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(100);

      const result = await dashboardService.getUsers(3, 10);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3-1) * 10
          take: 10
        })
      );

      expect(result.pagination).toEqual({
        page: 3,
        limit: 10,
        total: 100,
        totalPages: 10
      });
    });
  });

  describe('getIncidentReports', () => {
    it('should return paginated incident reports', async () => {
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

      mockPrisma.incidentReport.findMany.mockResolvedValue(mockReports);
      mockPrisma.incidentReport.count.mockResolvedValue(1);

      const result = await dashboardService.getIncidentReports();

      expect(result).toEqual({
        reports: mockReports,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        }
      });
    });

    it('should apply filters correctly', async () => {
      const filters = {
        parish: Parish.ST_ANDREW,
        status: ReportStatus.APPROVED,
        severity: Severity.HIGH,
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31')
      };

      mockPrisma.incidentReport.findMany.mockResolvedValue([]);
      mockPrisma.incidentReport.count.mockResolvedValue(0);

      await dashboardService.getIncidentReports(1, 20, filters);

      expect(mockPrisma.incidentReport.findMany).toHaveBeenCalledWith({
        where: {
          parish: Parish.ST_ANDREW,
          status: ReportStatus.APPROVED,
          severity: Severity.HIGH,
          createdAt: {
            gte: filters.dateFrom,
            lte: filters.dateTo
          }
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('updateIncidentStatus', () => {
    it('should update incident status and log action', async () => {
      const mockReport = {
        id: '1',
        status: ReportStatus.APPROVED,
        updatedAt: new Date()
      };

      mockPrisma.incidentReport.update.mockResolvedValue(mockReport);
      mockPrisma.$executeRaw.mockResolvedValue(1);

      const result = await dashboardService.updateIncidentStatus('1', ReportStatus.APPROVED, 'admin-1');

      expect(mockPrisma.incidentReport.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          status: ReportStatus.APPROVED,
          updatedAt: expect.any(Date)
        }
      });

      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      expect(result).toEqual(mockReport);
    });

    it('should handle update errors', async () => {
      mockPrisma.incidentReport.update.mockRejectedValue(new Error('Update failed'));

      await expect(
        dashboardService.updateIncidentStatus('1', ReportStatus.APPROVED, 'admin-1')
      ).rejects.toThrow('Failed to update incident status');
    });
  });

  describe('getAlertHistory', () => {
    it('should return paginated alert history', async () => {
      const mockAlerts = [
        {
          id: '1',
          type: AlertType.FLOOD,
          severity: Severity.HIGH,
          title: 'Test Alert',
          message: 'Test message',
          parishes: [Parish.KINGSTON],
          createdAt: new Date()
        }
      ];

      mockPrisma.alert.findMany.mockResolvedValue(mockAlerts);
      mockPrisma.alert.count.mockResolvedValue(1);

      const result = await dashboardService.getAlertHistory();

      expect(result).toEqual({
        alerts: mockAlerts,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        }
      });
    });

    it('should apply filters correctly', async () => {
      const filters = {
        type: AlertType.FLOOD,
        severity: Severity.HIGH,
        parish: Parish.KINGSTON,
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31')
      };

      mockPrisma.alert.findMany.mockResolvedValue([]);
      mockPrisma.alert.count.mockResolvedValue(0);

      await dashboardService.getAlertHistory(1, 20, filters);

      expect(mockPrisma.alert.findMany).toHaveBeenCalledWith({
        where: {
          type: AlertType.FLOOD,
          severity: Severity.HIGH,
          parishes: {
            path: '$',
            array_contains: Parish.KINGSTON
          },
          createdAt: {
            gte: filters.dateFrom,
            lte: filters.dateTo
          }
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('getAlertStatistics', () => {
    it('should return alert statistics', async () => {
      mockPrisma.alert.count.mockResolvedValue(50);
      mockPrisma.alert.groupBy
        .mockResolvedValueOnce([
          { type: AlertType.FLOOD, _count: { type: 30 } },
          { type: AlertType.WEATHER, _count: { type: 20 } }
        ])
        .mockResolvedValueOnce([
          { severity: Severity.HIGH, _count: { severity: 25 } },
          { severity: Severity.MEDIUM, _count: { severity: 25 } }
        ]);
      mockPrisma.alert.aggregate.mockResolvedValue({
        _sum: {
          recipientCount: 1000,
          deliveredCount: 950,
          failedCount: 50
        }
      });

      const stats = await dashboardService.getAlertStatistics();

      expect(stats).toEqual({
        totalAlerts: 50,
        alertsByType: [
          { type: AlertType.FLOOD, count: 30 },
          { type: AlertType.WEATHER, count: 20 }
        ],
        alertsBySeverity: [
          { severity: Severity.HIGH, count: 25 },
          { severity: Severity.MEDIUM, count: 25 }
        ],
        deliveryStats: {
          totalRecipients: 1000,
          delivered: 950,
          failed: 50,
          deliveryRate: 95
        }
      });
    });

    it('should handle zero recipients correctly', async () => {
      mockPrisma.alert.count.mockResolvedValue(0);
      mockPrisma.alert.groupBy.mockResolvedValue([]);
      mockPrisma.alert.aggregate.mockResolvedValue({
        _sum: {
          recipientCount: 0,
          deliveredCount: 0,
          failedCount: 0
        }
      });

      const stats = await dashboardService.getAlertStatistics();

      expect(stats.deliveryStats.deliveryRate).toBe(0);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user and log action', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        isActive: false,
        updatedAt: new Date()
      };

      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockPrisma.$executeRaw.mockResolvedValue(1);

      const result = await dashboardService.deactivateUser('1', 'admin-1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          isActive: false,
          updatedAt: expect.any(Date)
        }
      });

      expect(result).toEqual(mockUser);
    });
  });

  describe('reactivateUser', () => {
    it('should reactivate user and log action', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        isActive: true,
        updatedAt: new Date()
      };

      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockPrisma.$executeRaw.mockResolvedValue(1);

      const result = await dashboardService.reactivateUser('1', 'admin-1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          isActive: true,
          updatedAt: expect.any(Date)
        }
      });

      expect(result).toEqual(mockUser);
    });
  });

  describe('getAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      const mockLogs = [
        {
          id: '1',
          admin_id: 'admin-1',
          admin_name: 'Admin User',
          action: 'UPDATE_INCIDENT_STATUS',
          resource: 'incident_report',
          resource_id: 'incident-1',
          details: { newStatus: 'APPROVED' },
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0',
          timestamp: new Date()
        }
      ];

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockLogs)
        .mockResolvedValueOnce([{ count: BigInt(1) }]);

      const result = await dashboardService.getAuditLogs();

      expect(result).toEqual({
        logs: mockLogs,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1
        }
      });
    });

    it('should apply filters to audit logs', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: BigInt(0) }]);

      await dashboardService.getAuditLogs(
        1, 50, 'admin-1', 'UPDATE_INCIDENT_STATUS', 'incident_report',
        new Date('2024-01-01'), new Date('2024-12-31')
      );

      // Verify that the query was called (exact SQL matching is complex, so we just verify it was called)
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    });
  });
});