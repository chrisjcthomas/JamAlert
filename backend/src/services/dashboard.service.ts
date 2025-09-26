import { PrismaClient, Parish, ReportStatus, AlertType, Severity } from '@prisma/client';
import { getPrismaClient } from '../lib/database';
import { DashboardStats, SystemHealth } from '../types';

export interface UserManagementFilters {
  parish?: Parish;
  isActive?: boolean;
  search?: string;
}

export interface IncidentReviewFilters {
  parish?: Parish;
  status?: ReportStatus;
  incidentType?: string;
  severity?: Severity;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface AlertHistoryFilters {
  parish?: Parish;
  type?: AlertType;
  severity?: Severity;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Service for admin dashboard operations
 */
export class DashboardService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [
        userCount,
        activeAlerts,
        reportsToday,
        systemHealth
      ] = await Promise.all([
        this.getUserCount(),
        this.getActiveAlertsCount(),
        this.getReportsToday(),
        this.getSystemHealth()
      ]);

      return {
        userCount,
        activeAlerts,
        reportsToday,
        systemHealth
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  /**
   * Get total user count
   */
  private async getUserCount(): Promise<number> {
    return await this.prisma.user.count({
      where: { isActive: true }
    });
  }

  /**
   * Get active alerts count
   */
  private async getActiveAlertsCount(): Promise<number> {
    const now = new Date();
    return await this.prisma.alert.count({
      where: {
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      }
    });
  }

  /**
   * Get reports submitted today
   */
  private async getReportsToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await this.prisma.incidentReport.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });
  }

  /**
   * Get system health status
   */
  private async getSystemHealth(): Promise<SystemHealth> {
    const health: SystemHealth = {
      database: { status: 'healthy' },
      weather: { status: 'healthy' },
      notifications: { status: 'healthy' }
    };

    try {
      // Test database connection
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      health.database.latency = Date.now() - start;
    } catch (error) {
      health.database.status = 'unhealthy';
      health.database.error = error.message;
    }

    // TODO: Add weather API health check when implemented
    // TODO: Add notification service health check when implemented

    return health;
  }

  /**
   * Get users with pagination and filtering
   */
  async getUsers(
    page: number = 1,
    limit: number = 20,
    filters: UserManagementFilters = {}
  ) {
    try {
      const offset = (page - 1) * limit;
      
      const where: any = {};
      
      if (filters.parish) {
        where.parish = filters.parish;
      }
      
      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }
      
      if (filters.search) {
        where.OR = [
          { firstName: { contains: filters.search } },
          { lastName: { contains: filters.search } },
          { email: { contains: filters.search } }
        ];
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            parish: true,
            smsAlerts: true,
            emailAlerts: true,
            emergencyOnly: true,
            createdAt: true,
            isActive: true
          }
        }),
        this.prisma.user.count({ where })
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }

  /**
   * Get incident reports for review with pagination and filtering
   */
  async getIncidentReports(
    page: number = 1,
    limit: number = 20,
    filters: IncidentReviewFilters = {}
  ) {
    try {
      const offset = (page - 1) * limit;
      
      const where: any = {};
      
      if (filters.parish) {
        where.parish = filters.parish;
      }
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.incidentType) {
        where.incidentType = filters.incidentType;
      }
      
      if (filters.severity) {
        where.severity = filters.severity;
      }
      
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.createdAt.lte = filters.dateTo;
        }
      }

      const [reports, total] = await Promise.all([
        this.prisma.incidentReport.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.incidentReport.count({ where })
      ]);

      return {
        reports,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get incident reports: ${error.message}`);
    }
  }

  /**
   * Update incident report status
   */
  async updateIncidentStatus(
    reportId: string,
    status: ReportStatus,
    adminId: string
  ) {
    try {
      const report = await this.prisma.incidentReport.update({
        where: { id: reportId },
        data: { 
          status,
          updatedAt: new Date()
        }
      });

      // Log the action
      await this.logAdminAction(
        adminId,
        'UPDATE_INCIDENT_STATUS',
        'incident_report',
        reportId,
        { newStatus: status, previousStatus: report.status }
      );

      return report;
    } catch (error) {
      throw new Error(`Failed to update incident status: ${error.message}`);
    }
  }

  /**
   * Get alert history with pagination and filtering
   */
  async getAlertHistory(
    page: number = 1,
    limit: number = 20,
    filters: AlertHistoryFilters = {}
  ) {
    try {
      const offset = (page - 1) * limit;
      
      const where: any = {};
      
      if (filters.type) {
        where.type = filters.type;
      }
      
      if (filters.severity) {
        where.severity = filters.severity;
      }
      
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.createdAt.lte = filters.dateTo;
        }
      }

      // Filter by parish if specified
      if (filters.parish) {
        where.parishes = {
          path: '$',
          array_contains: filters.parish
        };
      }

      const [alerts, total] = await Promise.all([
        this.prisma.alert.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.alert.count({ where })
      ]);

      return {
        alerts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get alert history: ${error.message}`);
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStatistics(dateFrom?: Date, dateTo?: Date) {
    try {
      const where: any = {};
      
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = dateFrom;
        }
        if (dateTo) {
          where.createdAt.lte = dateTo;
        }
      }

      const [
        totalAlerts,
        alertsByType,
        alertsBySeverity,
        deliveryStats
      ] = await Promise.all([
        this.prisma.alert.count({ where }),
        this.prisma.alert.groupBy({
          by: ['type'],
          where,
          _count: { type: true }
        }),
        this.prisma.alert.groupBy({
          by: ['severity'],
          where,
          _count: { severity: true }
        }),
        this.prisma.alert.aggregate({
          where,
          _sum: {
            recipientCount: true,
            deliveredCount: true,
            failedCount: true
          }
        })
      ]);

      return {
        totalAlerts,
        alertsByType: alertsByType.map(item => ({
          type: item.type,
          count: item._count.type
        })),
        alertsBySeverity: alertsBySeverity.map(item => ({
          severity: item.severity,
          count: item._count.severity
        })),
        deliveryStats: {
          totalRecipients: deliveryStats._sum.recipientCount || 0,
          delivered: deliveryStats._sum.deliveredCount || 0,
          failed: deliveryStats._sum.failedCount || 0,
          deliveryRate: deliveryStats._sum.recipientCount 
            ? ((deliveryStats._sum.deliveredCount || 0) / deliveryStats._sum.recipientCount * 100)
            : 0
        }
      };
    } catch (error) {
      throw new Error(`Failed to get alert statistics: ${error.message}`);
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string, adminId: string) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { 
          isActive: false,
          updatedAt: new Date()
        }
      });

      // Log the action
      await this.logAdminAction(
        adminId,
        'DEACTIVATE_USER',
        'user',
        userId,
        { userEmail: user.email }
      );

      return user;
    } catch (error) {
      throw new Error(`Failed to deactivate user: ${error.message}`);
    }
  }

  /**
   * Reactivate user account
   */
  async reactivateUser(userId: string, adminId: string) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { 
          isActive: true,
          updatedAt: new Date()
        }
      });

      // Log the action
      await this.logAdminAction(
        adminId,
        'REACTIVATE_USER',
        'user',
        userId,
        { userEmail: user.email }
      );

      return user;
    } catch (error) {
      throw new Error(`Failed to reactivate user: ${error.message}`);
    }
  }

  /**
   * Log admin action for audit trail
   */
  private async logAdminAction(
    adminId: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // For now, we'll use a simple audit log table
      // In production, you might want to use a dedicated audit service
      await this.prisma.$executeRaw`
        INSERT INTO audit_logs (id, admin_id, action, resource, resource_id, details, ip_address, user_agent, timestamp)
        VALUES (UUID(), ${adminId}, ${action}, ${resource}, ${resourceId}, ${JSON.stringify(details)}, ${ipAddress}, ${userAgent}, NOW())
      `;
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      console.error('Failed to log admin action:', error);
    }
  }

  /**
   * Get audit logs with pagination
   */
  async getAuditLogs(
    page: number = 1,
    limit: number = 50,
    adminId?: string,
    action?: string,
    resource?: string,
    dateFrom?: Date,
    dateTo?: Date
  ) {
    try {
      const offset = (page - 1) * limit;
      
      // Build where conditions for raw query
      const conditions: string[] = [];
      const params: any[] = [];
      
      if (adminId) {
        conditions.push('al.admin_id = ?');
        params.push(adminId);
      }
      
      if (action) {
        conditions.push('al.action = ?');
        params.push(action);
      }
      
      if (resource) {
        conditions.push('al.resource = ?');
        params.push(resource);
      }
      
      if (dateFrom) {
        conditions.push('al.timestamp >= ?');
        params.push(dateFrom);
      }
      
      if (dateTo) {
        conditions.push('al.timestamp <= ?');
        params.push(dateTo);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      // Get audit logs with admin user names
      const logs = await this.prisma.$queryRaw`
        SELECT 
          al.id,
          al.admin_id,
          au.name as admin_name,
          al.action,
          al.resource,
          al.resource_id,
          al.details,
          al.ip_address,
          al.user_agent,
          al.timestamp
        FROM audit_logs al
        LEFT JOIN admin_users au ON al.admin_id = au.id
        ${whereClause}
        ORDER BY al.timestamp DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as AuditLogEntry[];

      // Get total count
      const totalResult = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM audit_logs al
        ${whereClause}
      ` as [{ count: bigint }];

      const total = Number(totalResult[0].count);

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get audit logs: ${error.message}`);
    }
  }
}