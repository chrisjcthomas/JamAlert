import { AdminService, CreateAdminUserData, AdminLoginData } from '../admin.service';
import { AdminRole } from '@prisma/client';
import { getPrismaClient } from '../../lib/database';
import { PasswordService } from '../../lib/auth';

// Mock the database
jest.mock('../../lib/database');
const mockPrisma = {
  adminUser: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

(getPrismaClient as jest.Mock).mockReturnValue(mockPrisma);

// Mock password service
jest.mock('../../lib/auth');
const mockPasswordService = PasswordService as jest.Mocked<typeof PasswordService>;

describe('AdminService', () => {
  let adminService: AdminService;

  beforeEach(() => {
    adminService = new AdminService();
    jest.clearAllMocks();
  });

  describe('createAdminUser', () => {
    const createData: CreateAdminUserData = {
      email: 'admin@test.com',
      password: 'password123!',
      name: 'Test Admin',
      role: AdminRole.ADMIN,
    };

    it('should create a new admin user successfully', async () => {
      const hashedPassword = 'hashed_password';
      const createdAdmin = {
        id: 'admin-1',
        email: createData.email,
        passwordHash: hashedPassword,
        name: createData.name,
        role: createData.role,
        lastLogin: null,
        createdAt: new Date(),
        isActive: true,
      };

      mockPrisma.adminUser.findUnique.mockResolvedValue(null);
      mockPasswordService.hashPassword.mockResolvedValue(hashedPassword);
      mockPrisma.adminUser.create.mockResolvedValue(createdAdmin);

      const result = await adminService.createAdminUser(createData);

      expect(mockPrisma.adminUser.findUnique).toHaveBeenCalledWith({
        where: { email: createData.email }
      });
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(createData.password);
      expect(mockPrisma.adminUser.create).toHaveBeenCalledWith({
        data: {
          email: createData.email,
          passwordHash: hashedPassword,
          name: createData.name,
          role: createData.role,
        }
      });
      expect(result).toEqual({
        id: createdAdmin.id,
        email: createdAdmin.email,
        name: createdAdmin.name,
        role: createdAdmin.role,
        lastLogin: createdAdmin.lastLogin,
        createdAt: createdAdmin.createdAt,
        isActive: createdAdmin.isActive,
      });
    });

    it('should throw error if admin with email already exists', async () => {
      const existingAdmin = {
        id: 'existing-admin',
        email: createData.email,
        passwordHash: 'existing_hash',
        name: 'Existing Admin',
        role: AdminRole.ADMIN,
        lastLogin: null,
        createdAt: new Date(),
        isActive: true,
      };

      mockPrisma.adminUser.findUnique.mockResolvedValue(existingAdmin);

      await expect(adminService.createAdminUser(createData)).rejects.toThrow(
        'Failed to create admin user: Admin user with this email already exists'
      );

      expect(mockPasswordService.hashPassword).not.toHaveBeenCalled();
      expect(mockPrisma.adminUser.create).not.toHaveBeenCalled();
    });

    it('should use default role if not provided', async () => {
      const createDataWithoutRole = {
        email: 'admin@test.com',
        password: 'password123!',
        name: 'Test Admin',
      };

      const hashedPassword = 'hashed_password';
      const createdAdmin = {
        id: 'admin-1',
        email: createDataWithoutRole.email,
        passwordHash: hashedPassword,
        name: createDataWithoutRole.name,
        role: AdminRole.ADMIN,
        lastLogin: null,
        createdAt: new Date(),
        isActive: true,
      };

      mockPrisma.adminUser.findUnique.mockResolvedValue(null);
      mockPasswordService.hashPassword.mockResolvedValue(hashedPassword);
      mockPrisma.adminUser.create.mockResolvedValue(createdAdmin);

      await adminService.createAdminUser(createDataWithoutRole);

      expect(mockPrisma.adminUser.create).toHaveBeenCalledWith({
        data: {
          email: createDataWithoutRole.email,
          passwordHash: hashedPassword,
          name: createDataWithoutRole.name,
          role: AdminRole.ADMIN,
        }
      });
    });
  });

  describe('authenticateAdmin', () => {
    const loginData: AdminLoginData = {
      email: 'admin@test.com',
      password: 'password123!',
    };

    it('should authenticate admin successfully', async () => {
      const adminUser = {
        id: 'admin-1',
        email: loginData.email,
        passwordHash: 'hashed_password',
        name: 'Test Admin',
        role: AdminRole.ADMIN,
        lastLogin: null,
        createdAt: new Date(),
        isActive: true,
      };

      const updatedAdmin = {
        ...adminUser,
        lastLogin: new Date(),
      };

      mockPrisma.adminUser.findUnique.mockResolvedValue(adminUser);
      mockPasswordService.verifyPassword.mockResolvedValue(true);
      mockPrisma.adminUser.update.mockResolvedValue(updatedAdmin);

      const result = await adminService.authenticateAdmin(loginData);

      expect(mockPrisma.adminUser.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email }
      });
      expect(mockPasswordService.verifyPassword).toHaveBeenCalledWith(
        loginData.password,
        adminUser.passwordHash
      );
      expect(mockPrisma.adminUser.update).toHaveBeenCalledWith({
        where: { id: adminUser.id },
        data: { lastLogin: expect.any(Date) }
      });
      expect(result).toEqual({
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        name: updatedAdmin.name,
        role: updatedAdmin.role,
        lastLogin: updatedAdmin.lastLogin,
        createdAt: updatedAdmin.createdAt,
        isActive: updatedAdmin.isActive,
      });
    });

    it('should return null for non-existent admin', async () => {
      mockPrisma.adminUser.findUnique.mockResolvedValue(null);

      const result = await adminService.authenticateAdmin(loginData);

      expect(result).toBeNull();
      expect(mockPasswordService.verifyPassword).not.toHaveBeenCalled();
      expect(mockPrisma.adminUser.update).not.toHaveBeenCalled();
    });

    it('should return null for inactive admin', async () => {
      const inactiveAdmin = {
        id: 'admin-1',
        email: loginData.email,
        passwordHash: 'hashed_password',
        name: 'Test Admin',
        role: AdminRole.ADMIN,
        lastLogin: null,
        createdAt: new Date(),
        isActive: false,
      };

      mockPrisma.adminUser.findUnique.mockResolvedValue(inactiveAdmin);

      const result = await adminService.authenticateAdmin(loginData);

      expect(result).toBeNull();
      expect(mockPasswordService.verifyPassword).not.toHaveBeenCalled();
      expect(mockPrisma.adminUser.update).not.toHaveBeenCalled();
    });

    it('should return null for invalid password', async () => {
      const adminUser = {
        id: 'admin-1',
        email: loginData.email,
        passwordHash: 'hashed_password',
        name: 'Test Admin',
        role: AdminRole.ADMIN,
        lastLogin: null,
        createdAt: new Date(),
        isActive: true,
      };

      mockPrisma.adminUser.findUnique.mockResolvedValue(adminUser);
      mockPasswordService.verifyPassword.mockResolvedValue(false);

      const result = await adminService.authenticateAdmin(loginData);

      expect(result).toBeNull();
      expect(mockPrisma.adminUser.update).not.toHaveBeenCalled();
    });
  });

  describe('getAdminById', () => {
    it('should return admin user by ID', async () => {
      const adminUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        passwordHash: 'hashed_password',
        name: 'Test Admin',
        role: AdminRole.ADMIN,
        lastLogin: null,
        createdAt: new Date(),
        isActive: true,
      };

      mockPrisma.adminUser.findUnique.mockResolvedValue(adminUser);

      const result = await adminService.getAdminById('admin-1');

      expect(mockPrisma.adminUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'admin-1' }
      });
      expect(result).toEqual({
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        lastLogin: adminUser.lastLogin,
        createdAt: adminUser.createdAt,
        isActive: adminUser.isActive,
      });
    });

    it('should return null for non-existent admin', async () => {
      mockPrisma.adminUser.findUnique.mockResolvedValue(null);

      const result = await adminService.getAdminById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('hasAdminUsers', () => {
    it('should return true if admin users exist', async () => {
      mockPrisma.adminUser.count.mockResolvedValue(1);

      const result = await adminService.hasAdminUsers();

      expect(result).toBe(true);
      expect(mockPrisma.adminUser.count).toHaveBeenCalled();
    });

    it('should return false if no admin users exist', async () => {
      mockPrisma.adminUser.count.mockResolvedValue(0);

      const result = await adminService.hasAdminUsers();

      expect(result).toBe(false);
    });
  });

  describe('listAdmins', () => {
    it('should return list of admin users', async () => {
      const adminUsers = [
        {
          id: 'admin-1',
          email: 'admin1@test.com',
          passwordHash: 'hash1',
          name: 'Admin 1',
          role: AdminRole.ADMIN,
          lastLogin: null,
          createdAt: new Date('2024-01-01'),
          isActive: true,
        },
        {
          id: 'admin-2',
          email: 'admin2@test.com',
          passwordHash: 'hash2',
          name: 'Admin 2',
          role: AdminRole.MODERATOR,
          lastLogin: new Date('2024-01-02'),
          createdAt: new Date('2024-01-02'),
          isActive: true,
        },
      ];

      mockPrisma.adminUser.findMany.mockResolvedValue(adminUsers);

      const result = await adminService.listAdmins();

      expect(mockPrisma.adminUser.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' }
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: adminUsers[0].id,
        email: adminUsers[0].email,
        name: adminUsers[0].name,
        role: adminUsers[0].role,
        lastLogin: adminUsers[0].lastLogin,
        createdAt: adminUsers[0].createdAt,
        isActive: adminUsers[0].isActive,
      });
    });
  });
});