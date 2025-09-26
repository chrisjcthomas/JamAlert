import { IncidentService } from '../incident.service';
import { ValidationService } from '../validation.service';
import { DatabaseService } from '../../lib/database';
import { IncidentReportRequest, Parish, IncidentType, Severity, ReportStatus } from '../../types';

// Mock the database service
jest.mock('../../lib/database');
jest.mock('../validation.service');

describe('IncidentService', () => {
  let incidentService: IncidentService;
  let mockPrisma: any;
  let mockValidationService: jest.Mocked<ValidationService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock Prisma client
    mockPrisma = {
      incidentReport: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn()
      }
    };

    // Mock DatabaseService
    (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockPrisma);

    // Mock ValidationService
    mockValidationService = new ValidationService() as jest.Mocked<ValidationService>;
    mockValidationService.validateIncidentReport = jest.fn();

    incidentService = new IncidentService();
    (incidentService as any).validationService = mockValidationService;
  });

  describe('createIncidentReport', () => {
    const validIncidentData: IncidentReportRequest = {
      incidentType: IncidentType.FLOOD,
      severity: Severity.HIGH,
      parish: Parish.KINGSTON,
      community: 'Downtown',
      address: '123 Main Street',
      description: 'Severe flooding on Main Street blocking traffic',
      incidentDate: new Date('2024-01-15'),
      incidentTime: '14:30',
      reporterName: 'John Doe',
      reporterPhone: '+18761234567',
      isAnonymous: false,
      receiveUpdates: true,
      latitude: 18.0179,
      longitude: -76.8099
    };

    it('should create incident report successfully with valid data', async () => {
      // Mock validation success
      mockValidationService.validateIncidentReport.mockReturnValue({
        isValid: true,
        errors: []
      });

      // Mock database creation
      const mockCreatedReport = {
        id: 'test-id-123',
        ...validIncidentData,
        status: ReportStatus.PENDING,
        verificationStatus: 'UNVERIFIED',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockPrisma.incidentReport.create.mockResolvedValue(mockCreatedReport);

      const result = await incidentService.createIncidentReport(validIncidentData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedReport);
      expect(result.message).toBe('Incident report created successfully');
      expect(mockPrisma.incidentReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          incidentType: IncidentType.FLOOD,
          severity: Severity.HIGH,
          parish: Parish.KINGSTON,
          status: ReportStatus.PENDING,
          verificationStatus: 'UNVERIFIED'
        })
      });
    });

    it('should handle anonymous reports by removing personal data', async () => {
      const anonymousData = {
        ...validIncidentData,
        isAnonymous: true,
        reporterName: 'John Doe',
        reporterPhone: '+18761234567',
        receiveUpdates: true
      };

      mockValidationService.validateIncidentReport.mockReturnValue({
        isValid: true,
        errors: []
      });

      const mockCreatedReport = {
        id: 'test-id-123',
        ...anonymousData,
        reporterName: null,
        reporterPhone: null,
        receiveUpdates: false,
        status: ReportStatus.PENDING,
        verificationStatus: 'UNVERIFIED',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockPrisma.incidentReport.create.mockResolvedValue(mockCreatedReport);

      const result = await incidentService.createIncidentReport(anonymousData);

      expect(result.success).toBe(true);
      expect(mockPrisma.incidentReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reporterName: null,
          reporterPhone: null,
          receiveUpdates: false,
          isAnonymous: true
        })
      });
    });

    it('should validate and process geolocation coordinates', async () => {
      const dataWithCoords = {
        ...validIncidentData,
        latitude: 18.0179, // Valid Jamaica latitude
        longitude: -76.8099 // Valid Jamaica longitude
      };

      mockValidationService.validateIncidentReport.mockReturnValue({
        isValid: true,
        errors: []
      });

      mockPrisma.incidentReport.create.mockResolvedValue({
        id: 'test-id-123',
        ...dataWithCoords,
        status: ReportStatus.PENDING,
        verificationStatus: 'UNVERIFIED',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await incidentService.createIncidentReport(dataWithCoords);

      expect(result.success).toBe(true);
      expect(mockPrisma.incidentReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          latitude: 18.0179,
          longitude: -76.8099
        })
      });
    });

    it('should reject invalid coordinates outside Jamaica', async () => {
      const dataWithInvalidCoords = {
        ...validIncidentData,
        latitude: 40.7128, // New York latitude (outside Jamaica)
        longitude: -74.0060 // New York longitude (outside Jamaica)
      };

      mockValidationService.validateIncidentReport.mockReturnValue({
        isValid: true,
        errors: []
      });

      mockPrisma.incidentReport.create.mockResolvedValue({
        id: 'test-id-123',
        ...dataWithInvalidCoords,
        latitude: null, // Should be null due to invalid coordinates
        longitude: null,
        status: ReportStatus.PENDING,
        verificationStatus: 'UNVERIFIED',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await incidentService.createIncidentReport(dataWithInvalidCoords);

      expect(result.success).toBe(true);
      expect(mockPrisma.incidentReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          latitude: null,
          longitude: null
        })
      });
    });

    it('should return validation errors for invalid data', async () => {
      const invalidData = {
        ...validIncidentData,
        description: '' // Invalid: empty description
      };

      mockValidationService.validateIncidentReport.mockReturnValue({
        isValid: false,
        errors: ['Description must be at least 10 characters']
      });

      const result = await incidentService.createIncidentReport(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.data).toEqual(['Description must be at least 10 characters']);
      expect(mockPrisma.incidentReport.create).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockValidationService.validateIncidentReport.mockReturnValue({
        isValid: true,
        errors: []
      });

      mockPrisma.incidentReport.create.mockRejectedValue(new Error('Database connection failed'));

      const result = await incidentService.createIncidentReport(validIncidentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create incident report');
    });
  });

  describe('getIncidentReports', () => {
    it('should fetch incident reports with filtering', async () => {
      const mockReports = [
        {
          id: 'report-1',
          incidentType: IncidentType.FLOOD,
          severity: Severity.HIGH,
          parish: Parish.KINGSTON,
          status: ReportStatus.PENDING,
          createdAt: new Date()
        },
        {
          id: 'report-2',
          incidentType: IncidentType.FIRE,
          severity: Severity.MEDIUM,
          parish: Parish.KINGSTON,
          status: ReportStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      mockPrisma.incidentReport.findMany.mockResolvedValue(mockReports);
      mockPrisma.incidentReport.count.mockResolvedValue(2);

      const result = await incidentService.getIncidentReports({
        parish: Parish.KINGSTON,
        status: ReportStatus.PENDING,
        page: 1,
        limit: 20
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReports);
      expect(mockPrisma.incidentReport.findMany).toHaveBeenCalledWith({
        where: {
          parish: Parish.KINGSTON,
          status: ReportStatus.PENDING
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should handle database errors when fetching reports', async () => {
      mockPrisma.incidentReport.findMany.mockRejectedValue(new Error('Database error'));

      const result = await incidentService.getIncidentReports();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch incident reports');
    });
  });

  describe('getIncidentReportById', () => {
    it('should fetch incident report by ID', async () => {
      const mockReport = {
        id: 'test-id-123',
        incidentType: IncidentType.FLOOD,
        severity: Severity.HIGH,
        parish: Parish.KINGSTON,
        status: ReportStatus.PENDING,
        createdAt: new Date()
      };

      mockPrisma.incidentReport.findUnique.mockResolvedValue(mockReport);

      const result = await incidentService.getIncidentReportById('test-id-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReport);
      expect(mockPrisma.incidentReport.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id-123' }
      });
    });

    it('should return error when report not found', async () => {
      mockPrisma.incidentReport.findUnique.mockResolvedValue(null);

      const result = await incidentService.getIncidentReportById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Incident report not found');
    });
  });

  describe('updateIncidentStatus', () => {
    it('should update incident status successfully', async () => {
      const mockUpdatedReport = {
        id: 'test-id-123',
        status: ReportStatus.APPROVED,
        updatedAt: new Date()
      };

      mockPrisma.incidentReport.update.mockResolvedValue(mockUpdatedReport);

      const result = await incidentService.updateIncidentStatus('test-id-123', ReportStatus.APPROVED);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedReport);
      expect(result.message).toBe('Incident report status updated to APPROVED');
      expect(mockPrisma.incidentReport.update).toHaveBeenCalledWith({
        where: { id: 'test-id-123' },
        data: {
          status: ReportStatus.APPROVED,
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should handle database errors when updating status', async () => {
      mockPrisma.incidentReport.update.mockRejectedValue(new Error('Database error'));

      const result = await incidentService.updateIncidentStatus('test-id-123', ReportStatus.APPROVED);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update incident status');
    });
  });

  describe('getMapData', () => {
    it('should fetch approved incidents with coordinates for map display', async () => {
      const mockMapData = [
        {
          id: 'incident-1',
          incidentType: IncidentType.FLOOD,
          severity: Severity.HIGH,
          parish: Parish.KINGSTON,
          latitude: 18.0179,
          longitude: -76.8099,
          description: 'Flooding on Main Street',
          createdAt: new Date(),
          status: ReportStatus.APPROVED
        }
      ];

      mockPrisma.incidentReport.findMany.mockResolvedValue(mockMapData);

      const result = await incidentService.getMapData();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMapData);
      expect(mockPrisma.incidentReport.findMany).toHaveBeenCalledWith({
        where: {
          status: ReportStatus.APPROVED,
          latitude: { not: null },
          longitude: { not: null }
        },
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
        take: 100
      });
    });

    it('should filter by parish when provided', async () => {
      mockPrisma.incidentReport.findMany.mockResolvedValue([]);

      const result = await incidentService.getMapData(Parish.KINGSTON);

      expect(result.success).toBe(true);
      expect(mockPrisma.incidentReport.findMany).toHaveBeenCalledWith({
        where: {
          status: ReportStatus.APPROVED,
          latitude: { not: null },
          longitude: { not: null },
          parish: Parish.KINGSTON
        },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    });
  });

  describe('getIncidentStats', () => {
    it('should return incident statistics', async () => {
      mockPrisma.incidentReport.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(20)  // pending
        .mockResolvedValueOnce(70)  // approved
        .mockResolvedValueOnce(10); // rejected

      mockPrisma.incidentReport.groupBy
        .mockResolvedValueOnce([
          { incidentType: IncidentType.FLOOD, _count: { id: 50 } },
          { incidentType: IncidentType.FIRE, _count: { id: 30 } }
        ])
        .mockResolvedValueOnce([
          { severity: Severity.HIGH, _count: { id: 40 } },
          { severity: Severity.MEDIUM, _count: { id: 35 } },
          { severity: Severity.LOW, _count: { id: 25 } }
        ]);

      const result = await incidentService.getIncidentStats();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        total: 100,
        byStatus: {
          pending: 20,
          approved: 70,
          rejected: 10
        },
        byType: {
          [IncidentType.FLOOD]: 50,
          [IncidentType.FIRE]: 30
        },
        bySeverity: {
          [Severity.HIGH]: 40,
          [Severity.MEDIUM]: 35,
          [Severity.LOW]: 25
        }
      });
    });
  });
});