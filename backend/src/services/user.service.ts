import { User, Parish } from '@prisma/client';
import { getPrismaClient, withRetry, DatabaseError } from '../lib/database';
import { UserRegistrationRequest, CreateUserData, UpdateUserData } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Create service instance
const userService = new UserService();

// Export convenience functions
export const createUser = (userData: UserRegistrationRequest) => userService.create(userData);
export const getUserByEmail = (email: string) => userService.findByEmail(email);
export const getUserById = (id: string) => userService.findById(id);
export const updateUser = (id: string, userData: UpdateUserData) => userService.update(id, userData);
export const deleteUser = (id: string) => userService.softDelete(id);
export const getUsersByParishes = (parishes: Parish[], activeOnly?: boolean) => userService.getUsersByParishes(parishes, activeOnly);
export const getEmailSubscribers = (parishes: Parish[], emergencyOnly?: boolean) => userService.getEmailSubscribers(parishes, emergencyOnly);
export const getSmsSubscribers = (parishes: Parish[], emergencyOnly?: boolean) => userService.getSmsSubscribers(parishes, emergencyOnly);
export const getUserStats = () => userService.getUserStats();
export const searchUsers = (params: any) => userService.searchUsers(params);
export const validateUser = (id: string) => userService.validateUser(id);
export const getUserAlertHistory = (userId: string, params: any) => userService.getUserAlertHistory(userId, params);
export const submitAlertFeedback = (userId: string, alertId: string, feedback: any) => userService.submitAlertFeedback(userId, alertId, feedback);
export const getUserAlertFeedback = (userId: string, alertId: string) => userService.getUserAlertFeedback(userId, alertId);
export const deactivateUser = (userId: string, reason?: string, feedback?: string) => userService.deactivateUser(userId, reason, feedback);

export class UserService {
  private prisma = getPrismaClient();

  /**
   * Create a new user
   */
  async create(userData: UserRegistrationRequest): Promise<User> {
    return withRetry(async () => {
      const user = await this.prisma.user.create({
        data: {
          id: uuidv4(),
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email.toLowerCase().trim(),
          phone: userData.phone?.trim() || null,
          parish: userData.parish,
          address: userData.address?.trim() || null,
          smsAlerts: userData.smsAlerts,
          emailAlerts: userData.emailAlerts,
          emergencyOnly: userData.emergencyOnly,
          accessibilitySettings: userData.accessibilitySettings ? JSON.parse(JSON.stringify(userData.accessibilitySettings)) : null,
        },
      });

      return user;
    }, 'Create user');
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return withRetry(async () => {
      return await this.prisma.user.findUnique({
        where: {
          email: email.toLowerCase().trim(),
        },
      });
    }, 'Find user by email');
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return withRetry(async () => {
      return await this.prisma.user.findUnique({
        where: { id },
      });
    }, 'Find user by ID');
  }

  /**
   * Update user data
   */
  async update(id: string, userData: UpdateUserData): Promise<User> {
    return withRetry(async () => {
      // Prepare update data, excluding undefined values
      const updateData: any = {};
      
      if (userData.firstName !== undefined) updateData.firstName = userData.firstName;
      if (userData.lastName !== undefined) updateData.lastName = userData.lastName;
      if (userData.email !== undefined) updateData.email = userData.email.toLowerCase().trim();
      if (userData.phone !== undefined) updateData.phone = userData.phone?.trim() || null;
      if (userData.parish !== undefined) updateData.parish = userData.parish;
      if (userData.address !== undefined) updateData.address = userData.address?.trim() || null;
      if (userData.smsAlerts !== undefined) updateData.smsAlerts = userData.smsAlerts;
      if (userData.emailAlerts !== undefined) updateData.emailAlerts = userData.emailAlerts;
      if (userData.emergencyOnly !== undefined) updateData.emergencyOnly = userData.emergencyOnly;
      if (userData.accessibilitySettings !== undefined) updateData.accessibilitySettings = userData.accessibilitySettings;
      if (userData.isActive !== undefined) updateData.isActive = userData.isActive;

      return await this.prisma.user.update({
        where: { id },
        data: updateData,
      });
    }, 'Update user');
  }

  /**
   * Delete user (soft delete by setting isActive to false)
   */
  async softDelete(id: string): Promise<User> {
    return withRetry(async () => {
      return await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
    }, 'Soft delete user');
  }

  /**
   * Hard delete user (permanent deletion)
   */
  async hardDelete(id: string): Promise<void> {
    return withRetry(async () => {
      await this.prisma.user.delete({
        where: { id },
      });
    }, 'Hard delete user');
  }

  /**
   * Get users by parish(es)
   */
  async getUsersByParishes(parishes: Parish[], activeOnly: boolean = true): Promise<User[]> {
    return withRetry(async () => {
      return await this.prisma.user.findMany({
        where: {
          parish: {
            in: parishes,
          },
          ...(activeOnly && { isActive: true }),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }, 'Get users by parishes');
  }

  /**
   * Get users with email alerts enabled for specific parishes
   */
  async getEmailSubscribers(parishes: Parish[], emergencyOnly: boolean = false): Promise<User[]> {
    return withRetry(async () => {
      return await this.prisma.user.findMany({
        where: {
          parish: {
            in: parishes,
          },
          emailAlerts: true,
          isActive: true,
          ...(emergencyOnly && { emergencyOnly: false }), // If emergencyOnly is true, exclude users who only want emergency alerts
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          parish: true,
          emergencyOnly: true,
          accessibilitySettings: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }, 'Get email subscribers');
  }

  /**
   * Get users with SMS alerts enabled for specific parishes
   */
  async getSmsSubscribers(parishes: Parish[], emergencyOnly: boolean = false): Promise<User[]> {
    return withRetry(async () => {
      return await this.prisma.user.findMany({
        where: {
          parish: {
            in: parishes,
          },
          smsAlerts: true,
          isActive: true,
          phone: {
            not: null,
          },
          ...(emergencyOnly && { emergencyOnly: false }),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          parish: true,
          emergencyOnly: true,
          accessibilitySettings: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }, 'Get SMS subscribers');
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    byParish: Record<string, number>;
    emailSubscribers: number;
    smsSubscribers: number;
  }> {
    return withRetry(async () => {
      const [
        total,
        active,
        byParish,
        emailSubscribers,
        smsSubscribers,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.groupBy({
          by: ['parish'],
          _count: { parish: true },
          where: { isActive: true },
        }),
        this.prisma.user.count({
          where: {
            emailAlerts: true,
            isActive: true,
          },
        }),
        this.prisma.user.count({
          where: {
            smsAlerts: true,
            isActive: true,
            phone: { not: null },
          },
        }),
      ]);

      const parishStats: Record<string, number> = {};
      byParish.forEach(item => {
        parishStats[item.parish] = item._count.parish;
      });

      return {
        total,
        active,
        byParish: parishStats,
        emailSubscribers,
        smsSubscribers,
      };
    }, 'Get user statistics');
  }

  /**
   * Search users with pagination
   */
  async searchUsers(params: {
    search?: string;
    parish?: Parish;
    activeOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      search,
      parish,
      activeOnly = true,
      page = 1,
      limit = 20,
    } = params;

    return withRetry(async () => {
      const skip = (page - 1) * limit;
      
      const where: any = {};
      
      if (activeOnly) {
        where.isActive = true;
      }
      
      if (parish) {
        where.parish = parish;
      }
      
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }, 'Search users');
  }

  /**
   * Validate user exists and is active
   */
  async validateUser(id: string): Promise<User> {
    const user = await this.findById(id);
    
    if (!user) {
      throw new DatabaseError('User not found');
    }
    
    if (!user.isActive) {
      throw new DatabaseError('User account is inactive');
    }
    
    return user;
  }

  /**
   * Get user alert history with pagination and filtering
   */
  async getUserAlertHistory(userId: string, params: {
    page?: number;
    limit?: number;
    type?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    alerts: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const {
      page = 1,
      limit = 20,
      type,
      severity,
      startDate,
      endDate,
    } = params;

    return withRetry(async () => {
      const skip = (page - 1) * limit;
      
      // First verify user exists
      await this.validateUser(userId);
      
      const where: any = {
        deliveryLogs: {
          some: {
            userId: userId,
          },
        },
      };
      
      if (type) {
        where.type = type;
      }
      
      if (severity) {
        where.severity = severity;
      }
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const [alerts, total] = await Promise.all([
        this.prisma.alert.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            deliveryLogs: {
              where: { userId },
              select: {
                deliveryMethod: true,
                status: true,
                sentAt: true,
                deliveredAt: true,
              },
            },
          },
        }),
        this.prisma.alert.count({ where }),
      ]);

      return {
        alerts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }, 'Get user alert history');
  }

  /**
   * Submit alert feedback
   */
  async submitAlertFeedback(userId: string, alertId: string, feedback: {
    rating: number;
    comment?: string;
    wasAccurate: boolean;
    wasHelpful: boolean;
  }): Promise<any> {
    return withRetry(async () => {
      // Verify user and alert exist
      await this.validateUser(userId);
      
      const alert = await this.prisma.alert.findUnique({
        where: { id: alertId },
      });
      
      if (!alert) {
        throw new DatabaseError('Alert not found');
      }

      // Check if feedback already exists
      const existingFeedback = await this.prisma.alertFeedback.findUnique({
        where: {
          userId_alertId: {
            userId,
            alertId,
          },
        },
      });

      if (existingFeedback) {
        // Update existing feedback
        return await this.prisma.alertFeedback.update({
          where: {
            userId_alertId: {
              userId,
              alertId,
            },
          },
          data: {
            rating: feedback.rating,
            comment: feedback.comment,
            wasAccurate: feedback.wasAccurate,
            wasHelpful: feedback.wasHelpful,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new feedback
        return await this.prisma.alertFeedback.create({
          data: {
            id: uuidv4(),
            userId,
            alertId,
            rating: feedback.rating,
            comment: feedback.comment,
            wasAccurate: feedback.wasAccurate,
            wasHelpful: feedback.wasHelpful,
          },
        });
      }
    }, 'Submit alert feedback');
  }

  /**
   * Get user's feedback for a specific alert
   */
  async getUserAlertFeedback(userId: string, alertId: string): Promise<any | null> {
    return withRetry(async () => {
      return await this.prisma.alertFeedback.findUnique({
        where: {
          userId_alertId: {
            userId,
            alertId,
          },
        },
      });
    }, 'Get user alert feedback');
  }

  /**
   * Deactivate user account with reason
   */
  async deactivateUser(userId: string, reason?: string, feedback?: string): Promise<User> {
    return withRetry(async () => {
      // Log the deactivation reason
      if (reason || feedback) {
        await this.prisma.userDeactivation.create({
          data: {
            id: uuidv4(),
            userId,
            reason: reason || 'No reason provided',
            feedback: feedback || null,
            deactivatedAt: new Date(),
          },
        });
      }

      return await this.prisma.user.update({
        where: { id: userId },
        data: { 
          isActive: false,
          emailAlerts: false,
          smsAlerts: false,
        },
      });
    }, 'Deactivate user');
  }
}