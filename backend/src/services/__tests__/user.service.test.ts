import { UserService } from '../user.service';
import { getPrismaClient } from '../../lib/database';
import { Parish } from '@prisma/client';
import { UserRegistrationRequest } from '../../types';

// Mock Prisma client
jest.mock('../../lib/database');
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
};

(getPrismaClient as jest.Mock).mockReturnValue(mockPrisma);

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validUserData: UserRegistrationRequest = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+18761234567',
      parish: Parish.KINGSTON,
      address: '123 Main St, Kingston',
      smsAlerts: true,
      emailAlerts: true,
      emergencyOnly: false,
      accessibilitySettings: {
        highContrast: false,
        largeFont: false,
        textToSpeech: false,
      },
    };

    it('should create a user successfully', async () => {
      const expectedUser = {
        id: 'test-uuid',
        ...validUserData,
        email: validUserData.email.toLowerCase(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      mockPrisma.user.create.mockResolvedValue(expectedUser);

      const result = await userService.create(validUserData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: validUserData.firstName,
          lastName: validUserData.lastName,
          email: validUserData.email.toLowerCase(),
          phone: validUserData.phone,
          parish: validUserData.parish,
          address: validUserData.address,
          smsAlerts: validUserData.smsAlerts,
          emailAlerts: validUserData.emailAlerts,
          emergencyOnly: validUserData.emergencyOnly,
          accessibilitySettings: validUserData.accessibilitySettings,
        }),
      });

      expect(result).toEqual(expectedUser);
    });

    it('should handle email normalization', async () => {
      const userDataWithUppercaseEmail = {
        ...validUserData,
        email: 'JOHN.DOE@EXAMPLE.COM',
      };

      const expectedUser = {
        id: 'test-uuid',
        ...userDataWithUppercaseEmail,
        email: 'john.doe@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      mockPrisma.user.create.mockResolvedValue(expectedUser);

      await userService.create(userDataWithUppercaseEmail);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'john.doe@example.com',
        }),
      });
    });

    it('should handle optional fields correctly', async () => {
      const minimalUserData: UserRegistrationRequest = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        parish: Parish.ST_ANDREW,
        smsAlerts: false,
        emailAlerts: true,
        emergencyOnly: false,
      };

      const expectedUser = {
        id: 'test-uuid',
        ...minimalUserData,
        phone: null,
        address: null,
        accessibilitySettings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      mockPrisma.user.create.mockResolvedValue(expectedUser);

      await userService.create(minimalUserData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phone: null,
          address: null,
          accessibilitySettings: null,
        }),
      });
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const email = 'john.doe@example.com';
      const expectedUser = {
        id: 'test-uuid',
        email,
        firstName: 'John',
        lastName: 'Doe',
      };

      mockPrisma.user.findUnique.mockResolvedValue(expectedUser);

      const result = await userService.findByEmail(email);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: email.toLowerCase() },
      });
      expect(result).toEqual(expectedUser);
    });

    it('should return null if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle email case insensitivity', async () => {
      const email = 'JOHN.DOE@EXAMPLE.COM';
      
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await userService.findByEmail(email);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john.doe@example.com' },
      });
    });
  });

  describe('getUsersByParishes', () => {
    it('should get users by parishes', async () => {
      const parishes = [Parish.KINGSTON, Parish.ST_ANDREW];
      const expectedUsers = [
        { id: '1', parish: Parish.KINGSTON, isActive: true },
        { id: '2', parish: Parish.ST_ANDREW, isActive: true },
      ];

      mockPrisma.user.findMany.mockResolvedValue(expectedUsers);

      const result = await userService.getUsersByParishes(parishes);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          parish: { in: parishes },
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(expectedUsers);
    });

    it('should include inactive users when activeOnly is false', async () => {
      const parishes = [Parish.KINGSTON];
      
      await userService.getUsersByParishes(parishes, false);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          parish: { in: parishes },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getEmailSubscribers', () => {
    it('should get email subscribers for parishes', async () => {
      const parishes = [Parish.KINGSTON];
      const expectedUsers = [
        {
          id: '1',
          email: 'user1@example.com',
          emailAlerts: true,
          isActive: true,
          parish: Parish.KINGSTON,
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(expectedUsers);

      const result = await userService.getEmailSubscribers(parishes);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          parish: { in: parishes },
          emailAlerts: true,
          isActive: true,
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
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(expectedUsers);
    });

    it('should exclude emergency-only users when emergencyOnly is true', async () => {
      const parishes = [Parish.KINGSTON];
      
      await userService.getEmailSubscribers(parishes, true);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          parish: { in: parishes },
          emailAlerts: true,
          isActive: true,
          emergencyOnly: false,
        },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const mockStats = {
        total: 100,
        active: 95,
        byParish: [
          { parish: Parish.KINGSTON, _count: { parish: 30 } },
          { parish: Parish.ST_ANDREW, _count: { parish: 25 } },
        ],
        emailSubscribers: 80,
        smsSubscribers: 45,
      };

      mockPrisma.user.count
        .mockResolvedValueOnce(mockStats.total)
        .mockResolvedValueOnce(mockStats.active)
        .mockResolvedValueOnce(mockStats.emailSubscribers)
        .mockResolvedValueOnce(mockStats.smsSubscribers);

      mockPrisma.user.groupBy.mockResolvedValue(mockStats.byParish);

      const result = await userService.getUserStats();

      expect(result).toEqual({
        total: 100,
        active: 95,
        byParish: {
          [Parish.KINGSTON]: 30,
          [Parish.ST_ANDREW]: 25,
        },
        emailSubscribers: 80,
        smsSubscribers: 45,
      });
    });
  });

  describe('update', () => {
    it('should update user data', async () => {
      const userId = 'test-uuid';
      const updateData = {
        firstName: 'Jane',
        emailAlerts: false,
      };

      const expectedUser = {
        id: userId,
        firstName: 'Jane',
        lastName: 'Doe',
        emailAlerts: false,
      };

      mockPrisma.user.update.mockResolvedValue(expectedUser);

      const result = await userService.update(userId, updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          firstName: 'Jane',
          emailAlerts: false,
        },
      });
      expect(result).toEqual(expectedUser);
    });

    it('should exclude undefined values from update', async () => {
      const userId = 'test-uuid';
      const updateData = {
        firstName: 'Jane',
        lastName: undefined,
        emailAlerts: false,
      };

      mockPrisma.user.update.mockResolvedValue({});

      await userService.update(userId, updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          firstName: 'Jane',
          emailAlerts: false,
        },
      });
    });
  });

  describe('validateUser', () => {
    it('should return user if exists and active', async () => {
      const userId = 'test-uuid';
      const user = {
        id: userId,
        isActive: true,
        firstName: 'John',
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await userService.validateUser(userId);

      expect(result).toEqual(user);
    });

    it('should throw error if user not found', async () => {
      const userId = 'nonexistent-uuid';
      
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userService.validateUser(userId)).rejects.toThrow('User not found');
    });

    it('should throw error if user is inactive', async () => {
      const userId = 'test-uuid';
      const user = {
        id: userId,
        isActive: false,
        firstName: 'John',
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(userService.validateUser(userId)).rejects.toThrow('User account is inactive');
    });
  });
});