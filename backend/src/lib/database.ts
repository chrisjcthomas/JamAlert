import { PrismaClient } from '@prisma/client';

// Global variable to store the Prisma client instance
let prisma: PrismaClient | null = null;

/**
 * Database connection configuration
 */
const DB_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  connectionTimeout: 10000, // 10 seconds
  queryTimeout: 30000, // 30 seconds
};

/**
 * Custom error class for database operations
 */
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get or create Prisma client instance with connection pooling
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Handle process termination
    process.on('beforeExit', async () => {
      await prisma?.$disconnect();
    });

    process.on('SIGINT', async () => {
      await prisma?.$disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await prisma?.$disconnect();
      process.exit(0);
    });
  }

  return prisma;
}

/**
 * Test database connection with retry logic
 */
export async function testDatabaseConnection(): Promise<boolean> {
  const client = getPrismaClient();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= DB_CONFIG.maxRetries; attempt++) {
    try {
      await client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      lastError = error as Error;
      console.error(`Database connection attempt ${attempt} failed:`, error);

      if (attempt < DB_CONFIG.maxRetries) {
        // Skip delay in test environment
        if (process.env.NODE_ENV !== 'test') {
          const delay = DB_CONFIG.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await sleep(delay);
        }
      }
    }
  }

  throw new DatabaseError(
    `Failed to connect to database after ${DB_CONFIG.maxRetries} attempts`,
    lastError || undefined
  );
}

/**
 * Execute database operation with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'Database operation'
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= DB_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`${operationName} attempt ${attempt} failed:`, error);

      // Don't retry on certain types of errors
      if (isNonRetryableError(error as Error)) {
        throw new DatabaseError(`${operationName} failed: ${error.message}`, error as Error);
      }

      if (attempt < DB_CONFIG.maxRetries) {
        // Skip delay in test environment
        if (process.env.NODE_ENV !== 'test') {
          const delay = DB_CONFIG.retryDelay * Math.pow(2, attempt - 1);
          console.log(`Retrying ${operationName} in ${delay}ms...`);
          await sleep(delay);
        }
      }
    }
  }

  throw new DatabaseError(
    `${operationName} failed after ${DB_CONFIG.maxRetries} attempts`,
    lastError || undefined
  );
}

/**
 * Check if an error should not be retried
 */
function isNonRetryableError(error: Error): boolean {
  const nonRetryablePatterns = [
    'Unique constraint',
    'Foreign key constraint',
    'Data too long',
    'Invalid input syntax',
    'Permission denied',
    'Authentication failed'
  ];

  return nonRetryablePatterns.some(pattern =>
    error.message.includes(pattern)
  );
}

/**
 * Execute database transaction with retry logic
 */
export async function withTransaction<T>(
  operation: (tx: PrismaClient) => Promise<T>,
  operationName: string = 'Database transaction'
): Promise<T> {
  return withRetry(async () => {
    const client = getPrismaClient();
    return await client.$transaction(operation, {
      timeout: DB_CONFIG.queryTimeout,
    });
  }, operationName);
}

/**
 * Health check for database
 */
export async function getDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  try {
    const startTime = Date.now();
    await testDatabaseConnection();
    const latency = Date.now() - startTime;

    return {
      status: 'healthy',
      latency
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Gracefully disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

// Backward-compatible alias for tests expecting getDatabase
export const getDatabase = getPrismaClient;
