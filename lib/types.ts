/**
 * Frontend types for JamAlert API
 * These types match the backend API contract
 */

// Parish enum matching backend
export enum Parish {
  KINGSTON = 'kingston',
  ST_ANDREW = 'st_andrew',
  ST_THOMAS = 'st_thomas',
  PORTLAND = 'portland',
  ST_MARY = 'st_mary',
  ST_ANN = 'st_ann',
  TRELAWNY = 'trelawny',
  ST_JAMES = 'st_james',
  HANOVER = 'hanover',
  WESTMORELAND = 'westmoreland',
  ST_ELIZABETH = 'st_elizabeth',
  MANCHESTER = 'manchester',
  CLARENDON = 'clarendon',
  ST_CATHERINE = 'st_catherine',
}

// Parish display names mapping
export const PARISH_NAMES: Record<Parish, string> = {
  [Parish.KINGSTON]: 'Kingston',
  [Parish.ST_ANDREW]: 'St. Andrew',
  [Parish.ST_THOMAS]: 'St. Thomas',
  [Parish.PORTLAND]: 'Portland',
  [Parish.ST_MARY]: 'St. Mary',
  [Parish.ST_ANN]: 'St. Ann',
  [Parish.TRELAWNY]: 'Trelawny',
  [Parish.ST_JAMES]: 'St. James',
  [Parish.HANOVER]: 'Hanover',
  [Parish.WESTMORELAND]: 'Westmoreland',
  [Parish.ST_ELIZABETH]: 'St. Elizabeth',
  [Parish.MANCHESTER]: 'Manchester',
  [Parish.CLARENDON]: 'Clarendon',
  [Parish.ST_CATHERINE]: 'St. Catherine',
};

// Helper function to convert display name to parish enum
export function getParishFromDisplayName(displayName: string): Parish | null {
  const entry = Object.entries(PARISH_NAMES).find(
    ([_, name]) => name.toLowerCase() === displayName.toLowerCase()
  );
  return entry ? (entry[0] as Parish) : null;
}

// Helper function to convert parish enum to display name
export function getDisplayNameFromParish(parish: Parish): string {
  return PARISH_NAMES[parish] || parish;
}

// Accessibility settings
export interface AccessibilitySettings {
  highContrast: boolean;
  largeFont: boolean;
  textToSpeech: boolean;
}

// User registration request
export interface UserRegistrationRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  parish: Parish;
  address?: string;
  smsAlerts: boolean;
  emailAlerts: boolean;
  emergencyOnly: boolean;
  accessibilitySettings?: AccessibilitySettings;
}

// User registration response
export interface UserRegistrationResponse {
  userId: string;
  email: string;
  parish: Parish;
}

// Form data interface for the registration form
export interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  parish: string; // Display name format
  address: string;
  smsAlerts: boolean;
  emailAlerts: boolean;
  emergencyOnly: boolean;
  terms: boolean;
}

// Convert form data to API request
export function formDataToApiRequest(formData: RegistrationFormData): UserRegistrationRequest {
  const parish = getParishFromDisplayName(formData.parish);
  
  if (!parish) {
    throw new Error('Invalid parish selected');
  }

  return {
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    email: formData.email.trim().toLowerCase(),
    phone: formData.phone.trim() || undefined,
    parish,
    address: formData.address.trim() || undefined,
    smsAlerts: formData.smsAlerts,
    emailAlerts: formData.emailAlerts,
    emergencyOnly: formData.emergencyOnly,
  };
}

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