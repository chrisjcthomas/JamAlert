import { PrismaClient, IncidentReport, Parish, IncidentType, Severity, ReportStatus } from '@prisma/client';
import { IncidentReportRequest, CreateIncidentData, ApiResponse } from '../types';
import { ValidationService } from './validation.service';
import { DatabaseService } from '../lib/database';

export class IncidentService {
  private prisma: PrismaClient;
  private validationService: ValidationService;

  constructor() {
    this.prisma = DatabaseService.getInstance();
    this.validationService = new ValidationService();
  }

  /**
   * Create a new incident report
   */
  async createIncidentReport(data: IncidentReportRequest): Promise<ApiResponse<IncidentReport>> {
    try {
      // Validate the incident data
      const validation = this.validationService.validateIncidentReport(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          data: validation.errors
        };
      }

      // Process geolocation coordinates
      const processedData = this.processGeolocation(data);

      // Handle anonymous reporting - exclude personal data if anonymous
      const sanitizedData = this.sanitizeReporterData(processedData);

      // Create the incident report
      const incidentReport = await this.prisma.incidentReport.create({
        data: {
          ...sanitizedData,
          status: ReportStatus.PENDING,
          verificationStatus: 'UNVERIFIED'
        }
      });

      return {
        success: true,
        data: incidentReport,
        message: 'Incident report created successfully'
      };
    } catch (error) {
      console.error('Error creating incident report:', error);
      return {
        success: false,
        error: 'Failed to create incident report'
      };
    }
  }

  /**
   * Get incident reports with filtering options
   */
  async getIncidentReports(options: {
    parish?: Parish;
    status?: ReportStatus;
    incidentType?: IncidentType;
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<IncidentReport[]>> {
    try {
      const { parish, status, incidentType, page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (parish) where.parish = parish;
      if (status) where.status = status;
      if (incidentType) where.incidentType = incidentType;

      const [reports, total] = await Promise.all([
        this.prisma.incidentReport.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.incidentReport.count({ where })
      ]);

      return {
        success: true,
        data: reports,
        message: `Found ${reports.length} incident reports`
      };
    } catch (error) {
      console.error('Error fetching incident reports:', error);
      return {
        success: false,
        error: 'Failed to fetch incident reports'
      };
    }
  }

  /**
   * Get incident report by ID
   */
  async getIncidentReportById(id: string): Promise<ApiResponse<IncidentReport>> {
    try {
      const report = await this.prisma.incidentReport.findUnique({
        where: { id }
      });

      if (!report) {
        return {
          success: false,
          error: 'Incident report not found'
        };
      }

      return {
        success: true,
        data: report
      };
    } catch (error) {
      console.error('Error fetching incident report:', error);
      return {
        success: false,
        error: 'Failed to fetch incident report'
      };
    }
  }

  /**
   * Update incident report status (admin function)
   */
  async updateIncidentStatus(
    id: string, 
    status: ReportStatus, 
    adminId?: string
  ): Promise<ApiResponse<IncidentReport>> {
    try {
      const report = await this.prisma.incidentReport.update({
        where: { id },
        data: { 
          status,
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        data: report,
        message: `Incident report status updated to ${status}`
      };
    } catch (error) {
      console.error('Error updating incident status:', error);
      return {
        success: false,
        error: 'Failed to update incident status'
      };
    }
  }

  /**
   * Get map data for incidents (public endpoint)
   */
  async getMapData(parish?: Parish): Promise<ApiResponse<any>> {
    try {
      const where: any = {
        status: ReportStatus.APPROVED,
        latitude: { not: null },
        longitude: { not: null }
      };

      if (parish) {
        where.parish = parish;
      }

      const incidents = await this.prisma.incidentReport.findMany({
        where,
        select: {
          id: true,
          incidentType: true,
          severity: true,
          parish: true,
          latitude: true,
          longitude: true,
          description: true,
          createdAt: true,
          status: true
        },
        orderBy: { createdAt: 'desc' },
        take: 100 // Limit to prevent too much data
      });

      return {
        success: true,
        data: incidents,
        message: `Found ${incidents.length} incidents for map display`
      };
    } catch (error) {
      console.error('Error fetching map data:', error);
      return {
        success: false,
        error: 'Failed to fetch map data'
      };
    }
  }

  /**
   * Process and validate geolocation coordinates
   */
  private processGeolocation(data: IncidentReportRequest): CreateIncidentData {
    const processedData: CreateIncidentData = {
      incidentType: data.incidentType,
      severity: data.severity,
      parish: data.parish,
      community: data.community,
      address: data.address,
      description: data.description,
      incidentDate: data.incidentDate,
      incidentTime: data.incidentTime,
      reporterName: data.reporterName,
      reporterPhone: data.reporterPhone,
      isAnonymous: data.isAnonymous,
      receiveUpdates: data.receiveUpdates,
      latitude: null,
      longitude: null
    };

    // Validate and process coordinates if provided
    if (data.latitude !== undefined && data.longitude !== undefined) {
      // Basic validation for Jamaica coordinates
      // Jamaica is approximately between 17.7-18.5°N and 76.2-78.4°W
      const lat = Number(data.latitude);
      const lng = Number(data.longitude);

      if (lat >= 17.7 && lat <= 18.5 && lng >= -78.4 && lng <= -76.2) {
        processedData.latitude = lat;
        processedData.longitude = lng;
      }
    }

    return processedData;
  }

  /**
   * Sanitize reporter data for anonymous reports
   */
  private sanitizeReporterData(data: CreateIncidentData): CreateIncidentData {
    if (data.isAnonymous) {
      return {
        ...data,
        reporterName: null,
        reporterPhone: null,
        receiveUpdates: false // Anonymous users can't receive updates
      };
    }

    return data;
  }

  /**
   * Get incident statistics
   */
  async getIncidentStats(parish?: Parish): Promise<ApiResponse<any>> {
    try {
      const where: any = {};
      if (parish) where.parish = parish;

      const [total, pending, approved, rejected, byType, bySeverity] = await Promise.all([
        this.prisma.incidentReport.count({ where }),
        this.prisma.incidentReport.count({ where: { ...where, status: ReportStatus.PENDING } }),
        this.prisma.incidentReport.count({ where: { ...where, status: ReportStatus.APPROVED } }),
        this.prisma.incidentReport.count({ where: { ...where, status: ReportStatus.REJECTED } }),
        this.prisma.incidentReport.groupBy({
          by: ['incidentType'],
          where,
          _count: { id: true }
        }),
        this.prisma.incidentReport.groupBy({
          by: ['severity'],
          where,
          _count: { id: true }
        })
      ]);

      const stats = {
        total,
        byStatus: {
          pending,
          approved,
          rejected
        },
        byType: byType.reduce((acc, item) => {
          acc[item.incidentType] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        bySeverity: bySeverity.reduce((acc, item) => {
          acc[item.severity] = item._count.id;
          return acc;
        }, {} as Record<string, number>)
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error fetching incident statistics:', error);
      return {
        success: false,
        error: 'Failed to fetch incident statistics'
      };
    }
  }
}