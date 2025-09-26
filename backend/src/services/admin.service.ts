import { PrismaClient, AdminUser, AdminRole } from '@prisma/client';
import { PasswordService } from '../lib/auth';
import { getPrismaClient } from '../lib/database';

export interface CreateAdminUserData {
  email: string;
  password: string;
  name: string;
  role?: AdminRole;
}

export interface AdminLoginData {
  email: string;
  password: string;
}

export interface AdminUserResponse {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  lastLogin: Date | null;
  createdAt: Date;
  isActive: boolean;
}

/**
 * Service for managing admin users and authentication
 */
export class AdminService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Create a new admin user
   */
  async createAdminUser(data: CreateAdminUserData): Promise<AdminUserResponse> {
    try {
      // Check if admin with email already exists
      const existingAdmin = await this.prisma.adminUser.findUnique({
        where: { email: data.email }
      });

      if (existingAdmin) {
        throw new Error('Admin user with this email already exists');
      }

      // Hash the password
      const passwordHash = await PasswordService.hashPassword(data.password);

      // Create the admin user
      const adminUser = await this.prisma.adminUser.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          role: data.role || AdminRole.ADMIN,
        }
      });

      return this.mapToResponse(adminUser);
    } catch (error) {
      throw new Error(`Failed to create admin user: ${error.message}`);
    }
  }

  /**
   * Authenticate admin user login
   */
  async authenticateAdmin(data: AdminLoginData): Promise<AdminUserResponse | null> {
    try {
      // Find admin user by email
      const adminUser = await this.prisma.adminUser.findUnique({
        where: { email: data.email }
      });

      if (!adminUser || !adminUser.isActive) {
        return null;
      }

      // Verify password
      const isValidPassword = await PasswordService.verifyPassword(
        data.password,
        adminUser.passwordHash
      );

      if (!isValidPassword) {
        return null;
      }

      // Update last login timestamp
      const updatedAdmin = await this.prisma.adminUser.update({
        where: { id: adminUser.id },
        data: { lastLogin: new Date() }
      });

      return this.mapToResponse(updatedAdmin);
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Get admin user by ID
   */
  async getAdminById(id: string): Promise<AdminUserResponse | null> {
    try {
      const adminUser = await this.prisma.adminUser.findUnique({
        where: { id }
      });

      if (!adminUser) {
        return null;
      }

      return this.mapToResponse(adminUser);
    } catch (error) {
      throw new Error(`Failed to get admin user: ${error.message}`);
    }
  }

  /**
   * Get admin user by email
   */
  async getAdminByEmail(email: string): Promise<AdminUserResponse | null> {
    try {
      const adminUser = await this.prisma.adminUser.findUnique({
        where: { email }
      });

      if (!adminUser) {
        return null;
      }

      return this.mapToResponse(adminUser);
    } catch (error) {
      throw new Error(`Failed to get admin user: ${error.message}`);
    }
  }

  /**
   * Update admin user
   */
  async updateAdmin(id: string, data: Partial<CreateAdminUserData>): Promise<AdminUserResponse> {
    try {
      const updateData: any = {};

      if (data.email) {
        updateData.email = data.email;
      }

      if (data.name) {
        updateData.name = data.name;
      }

      if (data.role) {
        updateData.role = data.role;
      }

      if (data.password) {
        updateData.passwordHash = await PasswordService.hashPassword(data.password);
      }

      const adminUser = await this.prisma.adminUser.update({
        where: { id },
        data: updateData
      });

      return this.mapToResponse(adminUser);
    } catch (error) {
      throw new Error(`Failed to update admin user: ${error.message}`);
    }
  }

  /**
   * Deactivate admin user
   */
  async deactivateAdmin(id: string): Promise<AdminUserResponse> {
    try {
      const adminUser = await this.prisma.adminUser.update({
        where: { id },
        data: { isActive: false }
      });

      return this.mapToResponse(adminUser);
    } catch (error) {
      throw new Error(`Failed to deactivate admin user: ${error.message}`);
    }
  }

  /**
   * List all admin users
   */
  async listAdmins(): Promise<AdminUserResponse[]> {
    try {
      const adminUsers = await this.prisma.adminUser.findMany({
        orderBy: { createdAt: 'desc' }
      });

      return adminUsers.map(admin => this.mapToResponse(admin));
    } catch (error) {
      throw new Error(`Failed to list admin users: ${error.message}`);
    }
  }

  /**
   * Check if any admin users exist (for initial setup)
   */
  async hasAdminUsers(): Promise<boolean> {
    try {
      const count = await this.prisma.adminUser.count();
      return count > 0;
    } catch (error) {
      throw new Error(`Failed to check admin users: ${error.message}`);
    }
  }

  /**
   * Map AdminUser to response format (excluding sensitive data)
   */
  private mapToResponse(adminUser: AdminUser): AdminUserResponse {
    return {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      lastLogin: adminUser.lastLogin,
      createdAt: adminUser.createdAt,
      isActive: adminUser.isActive,
    };
  }
}