/**
 * Tests for incident reporting API functions
 */

import { 
  submitIncidentReport, 
  formDataToApiRequest, 
  saveDraftToStorage, 
  loadDraftFromStorage, 
  clearDraftFromStorage,
  hasDraftInStorage,
  IncidentType,
  Severity,
  type IncidentReportFormData 
} from '../incidents';
import { Parish } from '../../types';
import { apiClient } from '../../api-client';

// Mock the API client
jest.mock('../../api-client');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Incident API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('formDataToApiRequest', () => {
    const validFormData: IncidentReportFormData = {
      incidentType: 'flood',
      severity: 'high',
      parish: 'kingston',
      community: 'New Kingston',
      address: '123 Main Street',
      description: 'Severe flooding on main road',
      date: '2024-01-15',
      time: '14:30',
      reporterName: 'John Doe',
      reporterPhone: '+1-876-123-4567',
      anonymous: false,
      receiveUpdates: true,
    };

    it('should convert valid form data to API request', () => {
      const result = formDataToApiRequest(validFormData);

      expect(result).toEqual({
        incidentType: IncidentType.FLOOD,
        severity: Severity.HIGH,
        parish: Parish.KINGSTON,
        community: 'New Kingston',
        address: '123 Main Street',
        description: 'Severe flooding on main road',
        incidentDate: new Date('2024-01-15'),
        incidentTime: '14:30',
        reporterName: 'John Doe',
        reporterPhone: '+1-876-123-4567',
        isAnonymous: false,
        receiveUpdates: true,
      });
    });

    it('should handle anonymous reports correctly', () => {
      const anonymousFormData = {
        ...validFormData,
        anonymous: true,
        reporterName: 'John Doe',
        reporterPhone: '+1-876-123-4567',
        receiveUpdates: true,
      };

      const result = formDataToApiRequest(anonymousFormData);

      expect(result.isAnonymous).toBe(true);
      expect(result.receiveUpdates).toBe(false);
      expect(result.reporterName).toBeUndefined();
      expect(result.reporterPhone).toBeUndefined();
    });

    it('should handle empty optional fields', () => {
      const minimalFormData = {
        ...validFormData,
        community: '',
        address: '',
        time: '',
        reporterName: '',
        reporterPhone: '',
      };

      const result = formDataToApiRequest(minimalFormData);

      expect(result.community).toBeUndefined();
      expect(result.address).toBeUndefined();
      expect(result.incidentTime).toBeUndefined();
      expect(result.reporterName).toBeUndefined();
      expect(result.reporterPhone).toBeUndefined();
    });

    it('should throw error for invalid parish', () => {
      const invalidFormData = {
        ...validFormData,
        parish: 'invalid-parish',
      };

      expect(() => formDataToApiRequest(invalidFormData)).toThrow('Invalid parish selected');
    });

    it('should throw error for invalid incident type', () => {
      const invalidFormData = {
        ...validFormData,
        incidentType: 'invalid-type',
      };

      expect(() => formDataToApiRequest(invalidFormData)).toThrow('Invalid incident type selected');
    });

    it('should throw error for invalid severity', () => {
      const invalidFormData = {
        ...validFormData,
        severity: 'invalid-severity',
      };

      expect(() => formDataToApiRequest(invalidFormData)).toThrow('Invalid severity level selected');
    });
  });

  describe('submitIncidentReport', () => {
    it('should call API client with correct data', async () => {
      const reportData = {
        incidentType: IncidentType.FLOOD,
        severity: Severity.HIGH,
        parish: Parish.KINGSTON,
        description: 'Test incident',
        incidentDate: new Date('2024-01-15'),
        isAnonymous: false,
        receiveUpdates: true,
      };

      const mockResponse = {
        id: 'test-id',
        status: 'pending' as const,
        parish: Parish.KINGSTON,
        incidentType: IncidentType.FLOOD,
        severity: Severity.HIGH,
        createdAt: new Date(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await submitIncidentReport(reportData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/incidents/report', reportData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Draft Storage Functions', () => {
    const testFormData: IncidentReportFormData = {
      incidentType: 'flood',
      severity: 'medium',
      parish: 'st. andrew',
      community: 'Half Way Tree',
      address: '',
      description: 'Test description',
      date: '2024-01-15',
      time: '10:00',
      reporterName: 'Test User',
      reporterPhone: '',
      anonymous: false,
      receiveUpdates: true,
    };

    describe('saveDraftToStorage', () => {
      it('should save draft to localStorage', () => {
        saveDraftToStorage(testFormData);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'jamalert_incident_draft',
          expect.stringContaining('"incidentType":"flood"')
        );
      });

      it('should handle localStorage errors gracefully', () => {
        localStorageMock.setItem.mockImplementation(() => {
          throw new Error('Storage quota exceeded');
        });

        // Should not throw
        expect(() => saveDraftToStorage(testFormData)).not.toThrow();
      });
    });

    describe('loadDraftFromStorage', () => {
      it('should load valid draft from localStorage', () => {
        const savedDraft = {
          ...testFormData,
          savedAt: new Date().toISOString(),
        };

        localStorageMock.getItem.mockReturnValue(JSON.stringify(savedDraft));

        const result = loadDraftFromStorage();

        expect(result).toEqual(savedDraft);
      });

      it('should return null for non-existent draft', () => {
        localStorageMock.getItem.mockReturnValue(null);

        const result = loadDraftFromStorage();

        expect(result).toBeNull();
      });

      it('should return null and clear old drafts', () => {
        const oldDraft = {
          ...testFormData,
          savedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
        };

        localStorageMock.getItem.mockReturnValue(JSON.stringify(oldDraft));

        const result = loadDraftFromStorage();

        expect(result).toBeNull();
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('jamalert_incident_draft');
      });

      it('should handle localStorage errors gracefully', () => {
        localStorageMock.getItem.mockImplementation(() => {
          throw new Error('Storage error');
        });

        const result = loadDraftFromStorage();

        expect(result).toBeNull();
      });
    });

    describe('clearDraftFromStorage', () => {
      it('should remove draft from localStorage', () => {
        clearDraftFromStorage();

        expect(localStorageMock.removeItem).toHaveBeenCalledWith('jamalert_incident_draft');
      });

      it('should handle localStorage errors gracefully', () => {
        localStorageMock.removeItem.mockImplementation(() => {
          throw new Error('Storage error');
        });

        // Should not throw
        expect(() => clearDraftFromStorage()).not.toThrow();
      });
    });

    describe('hasDraftInStorage', () => {
      it('should return true when valid draft exists', () => {
        const savedDraft = {
          ...testFormData,
          savedAt: new Date().toISOString(),
        };

        localStorageMock.getItem.mockReturnValue(JSON.stringify(savedDraft));

        const result = hasDraftInStorage();

        expect(result).toBe(true);
      });

      it('should return false when no draft exists', () => {
        localStorageMock.getItem.mockReturnValue(null);

        const result = hasDraftInStorage();

        expect(result).toBe(false);
      });

      it('should return false when draft is too old', () => {
        const oldDraft = {
          ...testFormData,
          savedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        };

        localStorageMock.getItem.mockReturnValue(JSON.stringify(oldDraft));

        const result = hasDraftInStorage();

        expect(result).toBe(false);
      });
    });
  });
});