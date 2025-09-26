/**
 * User Profile API functions
 */

import { apiClient } from '../api-client';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  parish: string;
  address?: string;
  emailAlerts: boolean;
  smsAlerts: boolean;
  emergencyOnly: boolean;
  accessibilitySettings?: {
    highContrast: boolean;
    largeFont: boolean;
    textToSpeech: boolean;
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    colorScheme: 'default' | 'high-contrast' | 'dark' | 'light';
    reduceMotion: boolean;
    screenReaderOptimized: boolean;
  };
}

export interface AlertHistoryItem {
  id: string;
  type: 'flood' | 'weather' | 'emergency' | 'all_clear';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  createdAt: string;
  deliveredAt?: string;
  feedback?: {
    rating: number;
    comment?: string;
    wasAccurate: boolean;
    wasHelpful: boolean;
  };
}

export interface AlertFeedback {
  rating: number;
  comment?: string;
  wasAccurate: boolean;
  wasHelpful: boolean;
}

export interface UnsubscribeRequest {
  action: 'partial' | 'complete';
  reason: string;
  feedback?: string;
}

export interface PaginatedAlerts {
  alerts: AlertHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  return apiClient.get(`/users/${userId}/profile`);
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
  return apiClient.put(`/users/${userId}/profile`, profile);
}

/**
 * Get user alert history with filtering and pagination
 */
export async function getUserAlertHistory(
  userId: string,
  params: {
    page?: number;
    limit?: number;
    type?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<PaginatedAlerts> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.append(key, value.toString());
    }
  });

  const queryString = searchParams.toString();
  const endpoint = `/users/${userId}/alerts${queryString ? `?${queryString}` : ''}`;
  
  return apiClient.get(endpoint);
}

/**
 * Submit feedback for an alert
 */
export async function submitAlertFeedback(
  userId: string,
  alertId: string,
  feedback: AlertFeedback
): Promise<AlertFeedback> {
  return apiClient.post(`/users/${userId}/alerts/${alertId}/feedback`, feedback);
}

/**
 * Get user's feedback for a specific alert
 */
export async function getUserAlertFeedback(
  userId: string,
  alertId: string
): Promise<AlertFeedback | null> {
  try {
    return await apiClient.get(`/users/${userId}/alerts/${alertId}/feedback`);
  } catch (error: any) {
    // Return null if feedback doesn't exist (404)
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get unsubscribe information for user
 */
export async function getUnsubscribeInfo(userId: string): Promise<{
  firstName: string;
  lastName: string;
  email: string;
  parish: string;
  emailAlerts: boolean;
  smsAlerts: boolean;
  emergencyOnly: boolean;
  isActive: boolean;
}> {
  return apiClient.get(`/users/${userId}/unsubscribe`);
}

/**
 * Process unsubscribe request
 */
export async function processUnsubscribe(
  userId: string,
  request: UnsubscribeRequest
): Promise<{
  action: string;
  isActive: boolean;
  emergencyOnly: boolean;
  emailAlerts: boolean;
  smsAlerts: boolean;
}> {
  return apiClient.post(`/users/${userId}/unsubscribe`, request);
}