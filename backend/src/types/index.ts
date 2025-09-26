import { 
  User, 
  Alert, 
  IncidentReport, 
  AdminUser, 
  AlertDeliveryLog,
  WeatherData,
  WeatherThreshold,
  WeatherAlert,
  Parish,
  AlertType,
  Severity,
  IncidentType,
  ReportStatus,
  VerificationStatus,
  AdminRole,
  DeliveryStatus,
  DeliveryMethod,
  DeliveryLogStatus,
  FloodRisk,
  WeatherAlertType
} from '@prisma/client';

// Re-export Prisma types
export {
  User,
  Alert,
  IncidentReport,
  AdminUser,
  AlertDeliveryLog,
  WeatherData,
  WeatherThreshold,
  WeatherAlert,
  Parish,
  AlertType,
  Severity,
  IncidentType,
  ReportStatus,
  VerificationStatus,
  AdminRole,
  DeliveryStatus,
  DeliveryMethod,
  DeliveryLogStatus,
  FloodRisk,
  WeatherAlertType
};

// API Request/Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User Registration
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

export interface AccessibilitySettings {
  highContrast: boolean;
  largeFont: boolean;
  textToSpeech: boolean;
}

// Admin Authentication
export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  user: Omit<AdminUser, 'passwordHash'>;
}

// Alert Management
export interface AlertCreateRequest {
  type: AlertType;
  severity: Severity;
  title: string;
  message: string;
  parishes: Parish[];
  expiresAt?: Date;
}

export interface AlertDispatchRequest extends AlertCreateRequest {
  sendImmediately?: boolean;
}

// Incident Reporting
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

// Map Data
export interface MapIncident {
  id: string;
  type: IncidentType;
  severity: Severity;
  parish: Parish;
  latitude: number;
  longitude: number;
  description: string;
  createdAt: Date;
  status: ReportStatus;
}

export interface MapAlert {
  id: string;
  type: AlertType;
  severity: Severity;
  parishes: Parish[];
  title: string;
  createdAt: Date;
  expiresAt?: Date;
}

// Dashboard Statistics
export interface DashboardStats {
  userCount: number;
  activeAlerts: number;
  reportsToday: number;
  systemHealth: SystemHealth;
}

export interface SystemHealth {
  database: {
    status: 'healthy' | 'unhealthy';
    latency?: number;
    error?: string;
  };
  weather: {
    status: 'healthy' | 'unhealthy';
    lastUpdate?: Date;
    error?: string;
  };
  notifications: {
    status: 'healthy' | 'unhealthy';
    error?: string;
  };
}

// Weather Data (API interfaces)
export interface WeatherConditions {
  parish: Parish;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  visibility: number;
  conditions: string;
  floodRisk: FloodRisk;
  recordedAt: Date;
}

export interface WeatherThresholdRequest {
  parish: Parish;
  rainfallThreshold: number;
  windSpeedThreshold: number;
  floodRiskThreshold: FloodRisk;
}

export interface ThresholdCheck {
  parish: Parish;
  exceeded: boolean;
  thresholds: {
    rainfall: number;
    windSpeed: number;
    floodRisk: FloodRisk;
  };
  actual: {
    rainfall: number;
    windSpeed: number;
    floodRisk: FloodRisk;
  };
  alertType?: WeatherAlertType;
  severity?: Severity;
}

// Notification Types
export interface NotificationPayload {
  title: string;
  message: string;
  type: AlertType;
  severity: Severity;
  alertId: string;
  parishes: Parish[];
}

export interface EmailNotification extends NotificationPayload {
  to: string;
  from: {
    name: string;
    email: string;
  };
  html?: string;
}

export interface SMSNotification extends NotificationPayload {
  to: string;
  from?: string;
}

export interface PushNotification extends NotificationPayload {
  userId: string;
  badge?: number;
  sound?: string;
  data?: Record<string, any>;
}

// Audit Log
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Utility Types
export type CreateUserData = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserData = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;
export type CreateAlertData = Omit<Alert, 'id' | 'createdAt' | 'deliveryStatus' | 'recipientCount' | 'deliveredCount' | 'failedCount'>;
export type CreateIncidentData = Omit<IncidentReport, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'verificationStatus'>;

// Function Context Types (for Azure Functions)
export interface FunctionContext {
  log: {
    error: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    info: (message: string, ...args: any[]) => void;
    verbose: (message: string, ...args: any[]) => void;
  };
  executionContext: {
    invocationId: string;
    functionName: string;
    functionDirectory: string;
  };
}