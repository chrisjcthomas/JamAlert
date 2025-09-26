/**
 * Authentication API service
 * Handles user registration and authentication endpoints
 */

import { apiClient } from '../api-client';
import { UserRegistrationRequest, UserRegistrationResponse } from '../types';

export class AuthService {
  /**
   * Register a new user
   */
  async register(userData: UserRegistrationRequest): Promise<UserRegistrationResponse> {
    return apiClient.post<UserRegistrationResponse>('/auth/register', userData);
  }

  /**
   * Verify email address (placeholder for future implementation)
   */
  async verifyEmail(token: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>('/auth/verify-email', { token });
  }

  /**
   * Resend verification email (placeholder for future implementation)
   */
  async resendVerification(email: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>('/auth/resend-verification', { email });
  }
}

// Export singleton instance
export const authService = new AuthService();