import { HttpRequest, InvocationContext } from '@azure/functions';
import { incidentsReport } from '../incidents-report';
import { IncidentService } from '../../services/incident.service';
import { ValidationService } from '../../services/validation.service';
import { IncidentType, Severity, Parish } from '../../types';

// Mock the services
jest.mock('../../services/incident.service');
jest.mock('../../services/validation.service');

describe('incidentsReport Function', () => {
  let mockIncidentService: jest.Mocked<IncidentService>;
  let mockValidationService: jest.Mocked<ValidationService>;
  let mockContext: Partial<InvocationContext>;
  let mockRequest: Partial<HttpRequest>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock IncidentService
    mockIncidentService = {
      createIncidentReport: jest.fn()
    } as any;
    (IncidentService as jest.Mock).mockImplementation(() => mockIncidentService);

    // Mock ValidationService
    mockValidationService = {
      validateRateLimit: jest.fn(),
      sanitizeText: jest.fn(),
      sanitizeAddress: jest.fn(),
      sanitizeName: jest.fn(),
      sanitizePhoneNumber: jest.fn()
    } as any;
    (ValidationService as jest.Mock).mockImplementation(() => mockValidationService);

    // Mock context
    mockContext = {
      log: jest.fn()
    };

    // Mock request
    mockRequest = {
      method: 'POST',
      headers: {
        get: jest.fn()
      },
      json: jest.fn()
    };
  });

  describe('HTTP Method Validation', () => {
    it('should reject non-POST requests', async () => {
      mockRequest.method = 'GET';

      const result = await incidentsReport(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(result.status).toBe(405);
      expect(result.jsonBody).toEqual({
        success: false,
        error: 'Method not allowed'
      });
    });
  });

  describe('Request Body Validation', () => {
    it('should reject requests without body', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue(null);

      const result = await incidentsReport(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(result.status).toBe(400);
      expect(result.jsonBody).toEqual({
        success: false,
        error: 'Request body is required'
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should reject requests when rate limit exceeded', async () => {
      const validData = {
        incidentType: IncidentType.FLOOD,
        severity: Severity.HIGH,
        parish: Parish.KINGSTON,
        description: 'Test incident description',
        incidentDate: new Date(),
        isAnonymous: false,
        receiveUpdates: false
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(validData);
      (mockRequest.headers!.get as jest.Mock).mockReturnValue('192.168.1.1');
      mockValidationService.validateRateLimit.mockReturnValue(false);

      const result = await incidentsReport(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(result.status).toBe(429);
      expect(result.jsonBody).toEqual({
        success: false,
        error: 'Too many requests. Please try again later.'
      });
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize input data correctly', async () => {
      const inputData = {
        incidentType: IncidentType.FLOOD,
        severity: Severity.HIGH,
        parish: Parish.KINGSTON,
        community: 'Downtown<script>',
        address: '123 Main St<iframe>',
        description: 'Flooding on main street',
        incidentDate: new Date(),
        incidentTime: '14:30',
        reporterName: 'John Doe',
        reporterPhone: '876-123-4567',
        isAnonymous: false,
        receiveUpdates: true,
        latitude: 18.0179,
        longitude: -76.8099
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(inputData);
      (mockRequest.headers!.get as jest.Mock).mockReturnValue('192.168.1.1');
      mockValidationService.validateRateLimit.mockReturnValue(true);
      mockValidationService.sanitizeText.mockImplementation((text) => text.replace(/<[^>]*>/g, ''));
      mockValidationService.sanitizeAddress.mockImplementation((text) => text.replace(/<[^>]*>/g, ''));
      mockValidationService.sanitizeName.mockImplementation((text) => text);
      mockValidationService.sanitizePhoneNumber.mockImplementation((text) => '+1876' + text.replace(/\D/g, '').slice(-7));

      mockIncidentService.createIncidentReport.mockResolvedValue({
        success: true,
        data: {
          id: 'test-id-123',
          ...inputData,
          status: 'PENDING',
          createdAt: new Date()
        }
      });

      const result = await incidentsReport(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(mockValidationService.sanitizeText).toHaveBeenCalledWith('Downtown<script>');
      expect(mockValidationService.sanitizeAddress).toHaveBeenCalledWith('123 Main St<iframe>');
      expect(mockValidationService.sanitizeName).toHaveBeenCalledWith('John Doe');
      expect(mockValidationService.sanitizePhoneNumber).toHaveBeenCalledWith('876-123-4567');
      expect(result.status).toBe(201);
    });
  });

  describe('Anonymous Reporting', () => {
    it('should handle anonymous reports by excluding personal data', async () => {
      const anonymousData = {
        incidentType: IncidentType.FLOOD,
        severity: Severity.HIGH,
        parish: Parish.KINGSTON,
        description: 'Anonymous flood report',
        incidentDate: new Date(),
        reporterName: 'John Doe', // Should be ignored
        reporterPhone: '876-123-4567', // Should be ignored
        isAnonymous: true,
        receiveUpdates: true // Should be set to false
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(anonymousData);
      (mockRequest.headers!.get as jest.Mock).mockReturnValue('192.168.1.1');
      mockValidationService.validateRateLimit.mockReturnValue(true);
      mockValidationService.sanitizeText.mockImplementation((text) => text);

      mockIncidentService.createIncidentReport.mockResolvedValue({
        success: true,
        data: {
          id: 'test-id-123',
          ...anonymousData,
          reporterName: undefined,
          reporterPhone: undefined,
          receiveUpdates: false,
          status: 'PENDING',
          createdAt: new Date()
        }
      });

      const result = await incidentsReport(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(mockIncidentService.createIncidentReport).toHaveBeenCalledWith(
        expect.objectContaining({
          reporterName: undefined,
          reporterPhone: undefined,
          receiveUpdates: false,
          isAnonymous: true
        })
      );
      expect(result.status).toBe(201);
    });
  });

  describe('Date Validation', () => {
    it('should reject future incident dates', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const invalidData = {
        incidentType: IncidentType.FLOOD,
        severity: Severity.HIGH,
        parish: Parish.KINGSTON,
        description: 'Test incident description',
        incidentDate: futureDate,
        isAnonymous: false,
        receiveUpdates: false
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(invalidData);
      (mockRequest.headers!.get as jest.Mock).mockReturnValue('192.168.1.1');
      mockValidationService.validateRateLimit.mockReturnValue(true);
      mockValidationService.sanitizeText.mockImplementation((text) => text);

      const result = await incidentsReport(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(result.status).toBe(400);
      expect(result.jsonBody).toEqual({
        success: false,
        error: 'Incident date cannot be in the future'
      });
    });

    it('should reject incident dates more than 30 days old', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);

      const invalidData = {
        incidentType: IncidentType.FLOOD,
        severity: Severity.HIGH,
        parish: Parish.KINGSTON,
        description: 'Test incident description',
        incidentDate: oldDate,
        isAnonymous: false,
        receiveUpdates: false
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(invalidData);
      (mockRequest.headers!.get as jest.Mock).mockReturnValue('192.168.1.1');
      mockValidationService.validateRateLimit.mockReturnValue(true);
      mockValidationService.sanitizeText.mockImplementation((text) => text);

      const result = await incidentsReport(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(result.status).toBe(400);
      expect(result.jsonBody).toEqual({
        success: false,
        error: 'Incident date cannot be more than 30 days in the past'
      });
    });
  });

  describe('Time Format Validation', () => {
    it('should reject invalid time format', async () => {
      const invalidData = {
        incidentType: IncidentType.FLOOD,
        severity: Severity.HIGH,
        parish: Parish.KINGSTON,
        description: 'Test incident description',
        incidentDate: new Date(),
        incidentTime: '25:70', // Invalid time
        isAnonymous: false,
        receiveUpdates: false
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(invalidData);
      (mockRequest.headers!.get as jest.Mock).mockReturnValue('192.168.1.1');
      mockValidationService.validateRateLimit.mockReturnValue(true);
      mockValidationService.sanitizeText.mockImplementation((text) => text);

      const result = await incidentsReport(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(result.status).toBe(400);
      expect(result.jsonBody).toEqual({
        success: false,
        error: 'Invalid time format. Use HH:MM format (24-hour)'
      });
    });

    it('should accept valid time format', async () => {
      const validData = {
        incidentType: IncidentType.FLOOD,
        severity: Severity.HIGH,
        parish: Parish.KINGSTON,
        description: 'Test incident description',
        incidentDate: new Date(),
        incidentTime: '14:30', // Valid time
        isAnonymous: false,
        receiveUpdates: false
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(validData);
      (mockRequest.headers!.get as jest.Mock).mockReturnValue('192.168.1.1');
      mockValidationService.validateRateLimit.mockReturnValue(true);
      mockValidationService.sanitizeText.mockImplementation((text) => text);

      mockIncidentService.createIncidentReport.mockResolvedValue({
        success: true,
        data: {
          id: 'test-id-123',
          ...validData,
          status: 'PENDING',
          createdAt: new Date()
        }
      });

      const result = await incidentsReport(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(result.status).toBe(201);
    });
  });

  describe('Reporter Information Validation', () => {
    it('should require reporter name for non-anonymous reports with updates', async () => {
      const invalidData = {
        incidentType: IncidentType.FLOOD,
        severity: Severity.HIGH,
        parish: Parish.KINGSTON,
        description: 'Test incident description',
        incidentDate: new Date(),
        reporterName: '', // Empty name
        isAnonymous: false,
        receiveUpdates: true
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(invalidData);
      (mockRequest.headers!.get as jest.Mock).mockReturnValue('192.168.1.1');
      mockValidationService.validateRateLimit.mockReturnValue(true);
      mockValidationService.sanitizeText.mockImplementation((text) => text);
      mockValidationService.sanitizeName.mockImplementation((text) => text);

      const result = await incidentsReport(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(result.status).toBe(400);
      expect(result.jsonBody).toEqual({
        success: false,
        error: 'Reporter name is required for non-anonymous reports with updates'
      });
    });
  });

  describe('Successful Report Creation', () => {
    it('should create incident report successfully', async () => {
      const validData = {
        incidentType: IncidentType.FLOOD,
        severity: Severity.HIGH,
        parish: Parish.KINGSTON,
        community: 'Downtown',
        address: '123 Main Street',
        description: 'Severe flooding blocking traffic',
        incidentDate: new Date(),
        incidentTime: '14:30',
        reporterName: 'John Doe',
        reporterPhone: '876-123-4567',
        isAnonymous: false,
        receiveUpdates: true,
        latitude: 18.0179,
        longitude: -76.8099
      };

      const mockCreatedReport = {
        id: 'test-id-123',
        ...validData,
        status: 'PENDING',
        createdAt: new Date()
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(validData);
      (mockRequest.headers!.get as jest.Mock).mockReturnValue('192.168.1.1');
      mockValidationService.validateRateLimit.mockReturnValue(true);
      mockValidationService.sanitizeText.mockImplementation((text) => text);
      mockValidationService.sanitizeAddress.mockImplementation((text) => text);
      mockValidationService.sanitizeName.mockImplementation((text) => text);
      mockValidationService.sanitizePhoneNumber.mockImplementation((text) => text);

      mockIncidentService.createIncidentReport.mockResolvedValue({
        success: true,
        data: mockCreatedReport
      });

      const result = await incidentsReport(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(result.status).toBe(201);
      expect(result.jsonBody).toEqual({
        success: true,
        data: {
          id: 'test-id-123',
          status: 'PENDING',
          parish: Parish.KINGSTON,
          incidentType: IncidentType.FLOOD,
          severity: Severity.HIGH,
          createdAt: mockCreatedReport.createdAt
        },
        message: 'Incident report submitted successfully. It will be reviewed by our team.'
      });
    });
  });

  describe('Service Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const validData = {
        incidentType: IncidentType.FLOOD,
        severity: Severity.HIGH,
        parish: Parish.KINGSTON,
        description: 'Test incident description',
        incidentDate: new Date(),
        isAnonymous: false,
        receiveUpdates: false
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(validData);
      (mockRequest.headers!.get as jest.Mock).mockReturnValue('192.168.1.1');
      mockValidationService.validateRateLimit.mockReturnValue(true);
      mockValidationService.sanitizeText.mockImplementation((text) => text);

      mockIncidentService.createIncidentReport.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      });

      const result = await incidentsReport(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(result.status).toBe(400);
      expect(result.jsonBody).toEqual({
        success: false,
        error: 'Database connection failed'
      });
    });

    it('should handle unexpected errors', async () => {
      const validData = {
        incidentType: IncidentType.FLOOD,
        severity: Severity.HIGH,
        parish: Parish.KINGSTON,
        description: 'Test incident description',
        incidentDate: new Date(),
        isAnonymous: false,
        receiveUpdates: false
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(validData);
      (mockRequest.headers!.get as jest.Mock).mockReturnValue('192.168.1.1');
      mockValidationService.validateRateLimit.mockReturnValue(true);
      mockValidationService.sanitizeText.mockImplementation((text) => text);

      mockIncidentService.createIncidentReport.mockRejectedValue(new Error('Unexpected error'));

      const result = await incidentsReport(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(result.status).toBe(500);
      expect(result.jsonBody).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });
  });
});