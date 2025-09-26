/**
 * Integration tests for incident reporting API
 * These tests verify the API integration works correctly
 */

import { 
  formDataToApiRequest, 
  saveDraftToStorage, 
  loadDraftFromStorage, 
  clearDraftFromStorage,
  type IncidentReportFormData 
} from '../incidents';

describe('Incident API Integration', () => {
  const validFormData: IncidentReportFormData = {
    incidentType: 'flood',
    severity: 'high',
    parish: 'kingston',
    community: 'New Kingston',
    address: '123 Main Street',
    description: 'Severe flooding on main road blocking traffic',
    date: '2024-01-15',
    time: '14:30',
    reporterName: 'John Doe',
    reporterPhone: '+1-876-123-4567',
    anonymous: false,
    receiveUpdates: true,
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Form Data Conversion', () => {
    it('should convert complete form data to API request', () => {
      const apiRequest = formDataToApiRequest(validFormData);
      
      expect(apiRequest.incidentType).toBe('flood');
      expect(apiRequest.severity).toBe('high');
      expect(apiRequest.parish).toBe('kingston');
      expect(apiRequest.community).toBe('New Kingston');
      expect(apiRequest.address).toBe('123 Main Street');
      expect(apiRequest.description).toBe('Severe flooding on main road blocking traffic');
      expect(apiRequest.incidentDate).toEqual(new Date('2024-01-15'));
      expect(apiRequest.incidentTime).toBe('14:30');
      expect(apiRequest.reporterName).toBe('John Doe');
      expect(apiRequest.reporterPhone).toBe('+1-876-123-4567');
      expect(apiRequest.isAnonymous).toBe(false);
      expect(apiRequest.receiveUpdates).toBe(true);
    });

    it('should handle anonymous reports correctly', () => {
      const anonymousFormData = {
        ...validFormData,
        anonymous: true,
        receiveUpdates: true, // Should be overridden to false
      };

      const apiRequest = formDataToApiRequest(anonymousFormData);
      
      expect(apiRequest.isAnonymous).toBe(true);
      expect(apiRequest.receiveUpdates).toBe(false);
      expect(apiRequest.reporterName).toBeUndefined();
      expect(apiRequest.reporterPhone).toBeUndefined();
    });

    it('should handle parish name variations', () => {
      const testCases = [
        { input: 'Kingston', expected: 'kingston' },
        { input: 'St. Andrew', expected: 'st_andrew' },
        { input: 'St Andrew', expected: 'st_andrew' },
        { input: 'St. Catherine', expected: 'st_catherine' },
        { input: 'St Catherine', expected: 'st_catherine' },
      ];

      testCases.forEach(({ input, expected }) => {
        const formData = { ...validFormData, parish: input };
        const apiRequest = formDataToApiRequest(formData);
        expect(apiRequest.parish).toBe(expected);
      });
    });
  });

  describe('Draft Storage', () => {
    it('should save and load draft correctly', () => {
      // Save draft
      saveDraftToStorage(validFormData);
      
      // Load draft
      const loadedDraft = loadDraftFromStorage();
      
      expect(loadedDraft).not.toBeNull();
      expect(loadedDraft?.incidentType).toBe(validFormData.incidentType);
      expect(loadedDraft?.severity).toBe(validFormData.severity);
      expect(loadedDraft?.parish).toBe(validFormData.parish);
      expect(loadedDraft?.description).toBe(validFormData.description);
      expect(loadedDraft?.savedAt).toBeDefined();
    });

    it('should clear draft correctly', () => {
      // Save draft first
      saveDraftToStorage(validFormData);
      expect(loadDraftFromStorage()).not.toBeNull();
      
      // Clear draft
      clearDraftFromStorage();
      expect(loadDraftFromStorage()).toBeNull();
    });

    it('should handle partial form data in drafts', () => {
      const partialFormData: IncidentReportFormData = {
        incidentType: 'flood',
        severity: '',
        parish: '',
        community: '',
        address: '',
        description: 'Partial description',
        date: '2024-01-15',
        time: '',
        reporterName: '',
        reporterPhone: '',
        anonymous: false,
        receiveUpdates: false,
      };

      saveDraftToStorage(partialFormData);
      const loadedDraft = loadDraftFromStorage();
      
      expect(loadedDraft).not.toBeNull();
      expect(loadedDraft?.incidentType).toBe('flood');
      expect(loadedDraft?.description).toBe('Partial description');
      expect(loadedDraft?.severity).toBe('');
    });
  });

  describe('Validation Edge Cases', () => {
    it('should throw error for invalid parish', () => {
      const invalidFormData = { ...validFormData, parish: 'Invalid Parish' };
      
      expect(() => formDataToApiRequest(invalidFormData)).toThrow('Invalid parish selected');
    });

    it('should throw error for invalid incident type', () => {
      const invalidFormData = { ...validFormData, incidentType: 'invalid-type' };
      
      expect(() => formDataToApiRequest(invalidFormData)).toThrow('Invalid incident type selected');
    });

    it('should throw error for invalid severity', () => {
      const invalidFormData = { ...validFormData, severity: 'invalid-severity' };
      
      expect(() => formDataToApiRequest(invalidFormData)).toThrow('Invalid severity level selected');
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

      const apiRequest = formDataToApiRequest(minimalFormData);
      
      expect(apiRequest.community).toBeUndefined();
      expect(apiRequest.address).toBeUndefined();
      expect(apiRequest.incidentTime).toBeUndefined();
      expect(apiRequest.reporterName).toBeUndefined();
      expect(apiRequest.reporterPhone).toBeUndefined();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle flood report with all details', () => {
      const floodReport: IncidentReportFormData = {
        incidentType: 'flood',
        severity: 'high',
        parish: 'st. andrew',
        community: 'Half Way Tree',
        address: 'Constant Spring Road near Liguanea',
        description: 'Heavy rainfall has caused severe flooding on Constant Spring Road. Water level is approximately 2 feet deep, making the road impassable for regular vehicles. Several cars are stranded.',
        date: '2024-01-15',
        time: '15:45',
        reporterName: 'Maria Johnson',
        reporterPhone: '+1-876-555-0123',
        anonymous: false,
        receiveUpdates: true,
      };

      const apiRequest = formDataToApiRequest(floodReport);
      
      expect(apiRequest.incidentType).toBe('flood');
      expect(apiRequest.severity).toBe('high');
      expect(apiRequest.parish).toBe('st_andrew');
      expect(apiRequest.description).toContain('Heavy rainfall');
      expect(apiRequest.isAnonymous).toBe(false);
      expect(apiRequest.receiveUpdates).toBe(true);
    });

    it('should handle anonymous accident report', () => {
      const accidentReport: IncidentReportFormData = {
        incidentType: 'accident',
        severity: 'medium',
        parish: 'kingston',
        community: 'Downtown Kingston',
        address: 'King Street and Barry Street intersection',
        description: 'Two-vehicle collision at intersection. Traffic is backing up. No serious injuries visible but emergency services needed.',
        date: '2024-01-15',
        time: '12:30',
        reporterName: 'Anonymous Reporter',
        reporterPhone: '',
        anonymous: true,
        receiveUpdates: false,
      };

      const apiRequest = formDataToApiRequest(accidentReport);
      
      expect(apiRequest.incidentType).toBe('accident');
      expect(apiRequest.severity).toBe('medium');
      expect(apiRequest.isAnonymous).toBe(true);
      expect(apiRequest.receiveUpdates).toBe(false);
      expect(apiRequest.reporterName).toBeUndefined();
      expect(apiRequest.reporterPhone).toBeUndefined();
    });

    it('should handle power outage report with minimal info', () => {
      const powerOutageReport: IncidentReportFormData = {
        incidentType: 'power',
        severity: 'low',
        parish: 'manchester',
        community: '',
        address: '',
        description: 'Power outage affecting several blocks in Mandeville area.',
        date: '2024-01-15',
        time: '',
        reporterName: '',
        reporterPhone: '',
        anonymous: true,
        receiveUpdates: false,
      };

      const apiRequest = formDataToApiRequest(powerOutageReport);
      
      expect(apiRequest.incidentType).toBe('power');
      expect(apiRequest.severity).toBe('low');
      expect(apiRequest.parish).toBe('manchester');
      expect(apiRequest.community).toBeUndefined();
      expect(apiRequest.address).toBeUndefined();
      expect(apiRequest.incidentTime).toBeUndefined();
      expect(apiRequest.isAnonymous).toBe(true);
    });
  });
});