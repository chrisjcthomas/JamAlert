/**
 * Incident reporting API functions
 */

import { apiClient } from '../api-client';
import { Parish } from '../types';

// Incident types matching backend
export enum IncidentType {
  FLOOD = 'flood',
  ACCIDENT = 'accident',
  FIRE = 'fire',
  POWER = 'power',
  WEATHER = 'weather',
  CRIME = 'crime',
  MEDICAL = 'medical',
  INFRASTRUCTURE = 'infrastructure',
  OTHER = 'other',
}

// Severity levels matching backend
export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

// Report status matching backend
export enum ReportStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RESOLVED = 'resolved',
}

// Incident report request interface
export interface IncidentReportRequest {
  incidentType: IncidentType;
  severity: Severity;
  parish: Parish;
  community?: string;
  address?: string;
  description: string;
  incidentDate: Date;
  incidentTime?: string;
  reporterName?: string;
  reporterPhone?: string;
  isAnonymous: boolean;
  receiveUpdates: boolean;
  latitude?: number;
  longitude?: number;
}

// Incident report response interface
export interface IncidentReportResponse {
  id: string;
  status: ReportStatus;
  parish: Parish;
  incidentType: IncidentType;
  severity: Severity;
  createdAt: Date;
}

// Form data interface for the report form
export interface IncidentReportFormData {
  incidentType: string;
  severity: string;
  parish: string;
  community: string;
  address: string;
  description: string;
  date: string;
  time: string;
  reporterName: string;
  reporterPhone: string;
  anonymous: boolean;
  receiveUpdates: boolean;
}

// Helper function to convert display name to parish enum
function getParishFromDisplayName(displayName: string): Parish | null {
  const parishMap: Record<string, Parish> = {
    'kingston': Parish.KINGSTON,
    'st. andrew': Parish.ST_ANDREW,
    'st andrew': Parish.ST_ANDREW,
    'st. thomas': Parish.ST_THOMAS,
    'st thomas': Parish.ST_THOMAS,
    'portland': Parish.PORTLAND,
    'st. mary': Parish.ST_MARY,
    'st mary': Parish.ST_MARY,
    'st. ann': Parish.ST_ANN,
    'st ann': Parish.ST_ANN,
    'trelawny': Parish.TRELAWNY,
    'st. james': Parish.ST_JAMES,
    'st james': Parish.ST_JAMES,
    'hanover': Parish.HANOVER,
    'westmoreland': Parish.WESTMORELAND,
    'st. elizabeth': Parish.ST_ELIZABETH,
    'st elizabeth': Parish.ST_ELIZABETH,
    'manchester': Parish.MANCHESTER,
    'clarendon': Parish.CLARENDON,
    'st. catherine': Parish.ST_CATHERINE,
    'st catherine': Parish.ST_CATHERINE,
  };
  
  return parishMap[displayName.toLowerCase()] || null;
}

// Helper function to convert incident type display to enum
function getIncidentTypeFromDisplay(display: string): IncidentType | null {
  const typeMap: Record<string, IncidentType> = {
    'flood': IncidentType.FLOOD,
    'accident': IncidentType.ACCIDENT,
    'fire': IncidentType.FIRE,
    'power': IncidentType.POWER,
    'weather': IncidentType.WEATHER,
    'crime': IncidentType.CRIME,
    'medical': IncidentType.MEDICAL,
    'infrastructure': IncidentType.INFRASTRUCTURE,
    'other': IncidentType.OTHER,
  };
  
  return typeMap[display.toLowerCase()] || null;
}

// Helper function to convert severity display to enum
function getSeverityFromDisplay(display: string): Severity | null {
  const severityMap: Record<string, Severity> = {
    'low': Severity.LOW,
    'medium': Severity.MEDIUM,
    'high': Severity.HIGH,
  };
  
  return severityMap[display.toLowerCase()] || null;
}

// Convert form data to API request
export function formDataToApiRequest(formData: IncidentReportFormData): IncidentReportRequest {
  const parish = getParishFromDisplayName(formData.parish);
  const incidentType = getIncidentTypeFromDisplay(formData.incidentType);
  const severity = getSeverityFromDisplay(formData.severity);
  
  if (!parish) {
    throw new Error('Invalid parish selected');
  }
  
  if (!incidentType) {
    throw new Error('Invalid incident type selected');
  }
  
  if (!severity) {
    throw new Error('Invalid severity level selected');
  }

  // Parse the date and time
  const incidentDate = new Date(formData.date);
  
  return {
    incidentType,
    severity,
    parish,
    community: formData.community.trim() || undefined,
    address: formData.address.trim() || undefined,
    description: formData.description.trim(),
    incidentDate,
    incidentTime: formData.time.trim() || undefined,
    reporterName: formData.anonymous ? undefined : (formData.reporterName.trim() || undefined),
    reporterPhone: formData.anonymous ? undefined : (formData.reporterPhone.trim() || undefined),
    isAnonymous: formData.anonymous,
    receiveUpdates: formData.anonymous ? false : formData.receiveUpdates,
  };
}

// Submit incident report
export async function submitIncidentReport(
  reportData: IncidentReportRequest
): Promise<IncidentReportResponse> {
  return apiClient.post<IncidentReportResponse>('/incidents/report', reportData);
}

// Draft storage key for localStorage
const DRAFT_STORAGE_KEY = 'jamalert_incident_draft';

// Save draft to localStorage
export function saveDraftToStorage(formData: IncidentReportFormData): void {
  try {
    const draftData = {
      ...formData,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
  } catch (error) {
    console.warn('Failed to save draft to localStorage:', error);
  }
}

// Load draft from localStorage
export function loadDraftFromStorage(): (IncidentReportFormData & { savedAt: string }) | null {
  try {
    const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!stored) return null;
    
    const draft = JSON.parse(stored);
    
    // Check if draft is not too old (7 days)
    const savedAt = new Date(draft.savedAt);
    const now = new Date();
    const daysDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 7) {
      clearDraftFromStorage();
      return null;
    }
    
    return draft;
  } catch (error) {
    console.warn('Failed to load draft from localStorage:', error);
    return null;
  }
}

// Clear draft from localStorage
export function clearDraftFromStorage(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear draft from localStorage:', error);
  }
}

// Check if draft exists
export function hasDraftInStorage(): boolean {
  return loadDraftFromStorage() !== null;
}

// Map data interfaces
export interface MapIncident {
  id: string;
  incidentType: IncidentType;
  severity: Severity;
  parish: Parish;
  latitude: number;
  longitude: number;
  description: string;
  createdAt: Date;
  status: ReportStatus;
}

export interface MapDataResponse {
  incidents: MapIncident[];
}

// Fetch map data for incidents
export async function fetchMapData(parish?: Parish): Promise<MapDataResponse> {
  const params = new URLSearchParams();
  if (parish) {
    params.append('parish', parish);
  }
  
  const url = `/incidents/map-data${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiClient.get<{ data: MapIncident[] }>(url);
  
  return {
    incidents: response.data.map(incident => ({
      ...incident,
      createdAt: new Date(incident.createdAt)
    }))
  };
}