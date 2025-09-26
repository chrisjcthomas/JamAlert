import { z } from 'zod';

/**
 * Environment configuration schema with validation
 */
const configSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  
  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('30m'),
  
  // Email Configuration
  SMTP_HOST: z.string().min(1, 'SMTP host is required'),
  SMTP_PORT: z.string().transform(val => parseInt(val, 10)).default('587'),
  SMTP_USER: z.string().email('Valid SMTP user email is required'),
  SMTP_PASS: z.string().min(1, 'SMTP password is required'),
  SMTP_FROM_NAME: z.string().default('JamAlert System'),
  SMTP_FROM_EMAIL: z.string().email().optional(),
  
  // External APIs
  WEATHER_API_KEY: z.string().min(1, 'Weather API key is required'),
  WEATHER_API_URL: z.string().url().default('https://api.openweathermap.org/data/2.5'),
  JAMAICA_MET_API_URL: z.string().url().optional(),
  
  // Azure Services
  AZURE_NOTIFICATION_HUB_CONNECTION: z.string().optional(),
  AZURE_STORAGE_CONNECTION: z.string().optional(),
  APPLICATIONINSIGHTS_CONNECTION_STRING: z.string().optional(),
  
  // Application Settings
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(val => parseInt(val, 10)).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(val => parseInt(val, 10)).default('100'),
  
  // Alert System
  MAX_ALERT_RECIPIENTS: z.string().transform(val => parseInt(val, 10)).default('10000'),
  ALERT_BATCH_SIZE: z.string().transform(val => parseInt(val, 10)).default('100'),
  ALERT_RETRY_ATTEMPTS: z.string().transform(val => parseInt(val, 10)).default('3'),
  
  // Weather Monitoring
  WEATHER_CHECK_INTERVAL_MINUTES: z.string().transform(val => parseInt(val, 10)).default('15'),
  FLOOD_THRESHOLD_MM: z.string().transform(val => parseInt(val, 10)).default('50'),
  WIND_THRESHOLD_KMH: z.string().transform(val => parseInt(val, 10)).default('60'),
  
  // Cache Settings
  CACHE_TTL_SECONDS: z.string().transform(val => parseInt(val, 10)).default('3600'), // 1 hour
  WEATHER_CACHE_TTL_SECONDS: z.string().transform(val => parseInt(val, 10)).default('900'), // 15 minutes
});

/**
 * Parsed and validated configuration
 */
let config: z.infer<typeof configSchema> | null = null;

/**
 * Get application configuration with validation
 */
export function getConfig(): z.infer<typeof configSchema> {
  if (!config) {
    try {
      config = configSchema.parse(process.env);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const missingFields = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Configuration validation failed:\n${missingFields.join('\n')}`);
      }
      throw error;
    }
  }
  
  return config;
}

/**
 * Database configuration
 */
export function getDatabaseConfig() {
  const cfg = getConfig();
  return {
    url: cfg.DATABASE_URL,
    maxRetries: 3,
    retryDelay: 1000,
    connectionTimeout: 10000,
    queryTimeout: 30000,
  };
}

/**
 * JWT configuration
 */
export function getJwtConfig() {
  const cfg = getConfig();
  return {
    secret: cfg.JWT_SECRET,
    expiresIn: cfg.JWT_EXPIRES_IN,
  };
}

/**
 * Email configuration
 */
export function getEmailConfig() {
  const cfg = getConfig();
  return {
    host: cfg.SMTP_HOST,
    port: cfg.SMTP_PORT,
    secure: cfg.SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: cfg.SMTP_USER,
      pass: cfg.SMTP_PASS,
    },
    from: {
      name: cfg.SMTP_FROM_NAME,
      email: cfg.SMTP_FROM_EMAIL || cfg.SMTP_USER,
    },
  };
}

/**
 * Weather API configuration
 */
export function getWeatherConfig() {
  const cfg = getConfig();
  return {
    apiKey: cfg.WEATHER_API_KEY,
    apiUrl: cfg.WEATHER_API_URL,
    jamaicaMetUrl: cfg.JAMAICA_MET_API_URL,
    checkIntervalMinutes: cfg.WEATHER_CHECK_INTERVAL_MINUTES,
    floodThresholdMm: cfg.FLOOD_THRESHOLD_MM,
    windThresholdKmh: cfg.WIND_THRESHOLD_KMH,
    cacheTtlSeconds: cfg.WEATHER_CACHE_TTL_SECONDS,
  };
}

/**
 * Alert system configuration
 */
export function getAlertConfig() {
  const cfg = getConfig();
  return {
    maxRecipients: cfg.MAX_ALERT_RECIPIENTS,
    batchSize: cfg.ALERT_BATCH_SIZE,
    retryAttempts: cfg.ALERT_RETRY_ATTEMPTS,
  };
}

/**
 * Rate limiting configuration
 */
export function getRateLimitConfig() {
  const cfg = getConfig();
  return {
    windowMs: cfg.RATE_LIMIT_WINDOW_MS,
    maxRequests: cfg.RATE_LIMIT_MAX_REQUESTS,
  };
}

/**
 * Azure services configuration
 */
export function getAzureConfig() {
  const cfg = getConfig();
  return {
    notificationHubConnection: cfg.AZURE_NOTIFICATION_HUB_CONNECTION,
    storageConnection: cfg.AZURE_STORAGE_CONNECTION,
    applicationInsightsConnection: cfg.APPLICATIONINSIGHTS_CONNECTION_STRING,
  };
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getConfig().NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getConfig().NODE_ENV === 'development';
}

/**
 * Check if running in test environment
 */
export function isTest(): boolean {
  return getConfig().NODE_ENV === 'test';
}

/**
 * Get log level
 */
export function getLogLevel(): string {
  return getConfig().LOG_LEVEL;
}