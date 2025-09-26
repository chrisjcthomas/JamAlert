import { getPrismaClient, testDatabaseConnection, withRetry, DatabaseError } from '../database';
import { mockContext } from '../../test/setup';

// Mock Prisma Client
const mockPrismaClient = {
  $queryRaw: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

describe('Database Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPrismaClient', () => {
    it('should return a Prisma client instance', () => {
      const client = getPrismaClient();
      expect(client).toBeDefined();
    });

    it('should return the same instance on subsequent calls', () => {
      const client1 = getPrismaClient();
      const client2 = getPrismaClient();
      expect(client1).toBe(client2);
    });
  });

  describe('testDatabaseConnection', () => {
    it('should return true for successful connection', async () => {
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);

      const result = await testDatabaseConnection();
      expect(result).toBe(true);
      expect(mockPrismaClient.$queryRaw).toHaveBeenCalledWith(['SELECT 1']);
    });

    it('should retry on connection failure and eventually succeed', async () => {
      mockPrismaClient.$queryRaw
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce([{ '1': 1 }]);

      const result = await testDatabaseConnection();
      expect(result).toBe(true);
      expect(mockPrismaClient.$queryRaw).toHaveBeenCalledTimes(3);
    });

    it('should throw DatabaseError after max retries', async () => {
      const connectionError = new Error('Connection failed');
      mockPrismaClient.$queryRaw.mockRejectedValue(connectionError);

      await expect(testDatabaseConnection()).rejects.toThrow(DatabaseError);
      expect(mockPrismaClient.$queryRaw).toHaveBeenCalledTimes(3);
    });
  });

  describe('withRetry', () => {
    it('should execute operation successfully on first try', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await withRetry(mockOperation, 'Test operation');
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry operation on failure and eventually succeed', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce('success');

      const result = await withRetry(mockOperation, 'Test operation');
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValue(new Error('Unique constraint violation'));

      await expect(withRetry(mockOperation, 'Test operation')).rejects.toThrow(DatabaseError);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should throw DatabaseError after max retries', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValue(new Error('Persistent failure'));

      await expect(withRetry(mockOperation, 'Test operation')).rejects.toThrow(DatabaseError);
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });
  });

  describe('DatabaseError', () => {
    it('should create error with message and original error', () => {
      const originalError = new Error('Original error');
      const dbError = new DatabaseError('Database operation failed', originalError);

      expect(dbError.message).toBe('Database operation failed');
      expect(dbError.originalError).toBe(originalError);
      expect(dbError.name).toBe('DatabaseError');
    });

    it('should create error with message only', () => {
      const dbError = new DatabaseError('Database operation failed');

      expect(dbError.message).toBe('Database operation failed');
      expect(dbError.originalError).toBeUndefined();
      expect(dbError.name).toBe('DatabaseError');
    });
  });
});