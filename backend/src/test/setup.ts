import { getPrismaClient } from '../lib/database';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/jamalert_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-32-chars';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'test-password';
process.env.WEATHER_API_KEY = 'test-weather-api-key';

// Global test setup
beforeAll(async () => {
  // Setup test database or mock connections
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Cleanup test database connections
  const prisma = getPrismaClient();
  await prisma.$disconnect();
  console.log('Cleaning up test environment...');
});

// Mock external services for testing
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    verify: jest.fn().mockResolvedValue(true),
  })),
}));

// Mock Azure Functions context
export const mockContext = {
  log: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    verbose: jest.fn(),
  },
  executionContext: {
    invocationId: 'test-invocation-id',
    functionName: 'test-function',
    functionDirectory: '/test',
  },
};