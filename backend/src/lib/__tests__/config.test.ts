import { getConfig, getDatabaseConfig, getJwtConfig, getEmailConfig, isProduction, isDevelopment } from '../config';

describe('Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getConfig', () => {
    it('should parse valid environment variables', () => {
      process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test';
      process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-32-chars';
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_USER = 'test@test.com';
      process.env.SMTP_PASS = 'test-password';
      process.env.WEATHER_API_KEY = 'test-weather-key';

      const config = getConfig();
      expect(config.DATABASE_URL).toBe('mysql://test:test@localhost:3306/test');
      expect(config.JWT_SECRET).toBe('test-jwt-secret-key-for-testing-only-32-chars');
      expect(config.SMTP_HOST).toBe('smtp.test.com');
    });

    it('should throw error for missing required variables', () => {
      delete process.env.DATABASE_URL;

      expect(() => getConfig()).toThrow('Configuration validation failed');
    });

    it('should throw error for invalid JWT secret length', () => {
      process.env.JWT_SECRET = 'short';

      expect(() => getConfig()).toThrow('JWT secret must be at least 32 characters');
    });

    it('should use default values for optional variables', () => {
      process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test';
      process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-32-chars';
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_USER = 'test@test.com';
      process.env.SMTP_PASS = 'test-password';
      process.env.WEATHER_API_KEY = 'test-weather-key';
      delete process.env.NODE_ENV; // Ensure default value usage

      const config = getConfig();
      expect(config.NODE_ENV).toBe('development');
      expect(config.LOG_LEVEL).toBe('info');
      expect(config.SMTP_PORT).toBe(587);
    });
  });

  describe('getDatabaseConfig', () => {
    it('should return database configuration', () => {
      process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test';

      const dbConfig = getDatabaseConfig();
      expect(dbConfig.url).toBe('mysql://test:test@localhost:3306/test');
      expect(dbConfig.maxRetries).toBe(3);
      expect(dbConfig.retryDelay).toBe(1000);
    });
  });

  describe('getJwtConfig', () => {
    it('should return JWT configuration', () => {
      process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-32-chars';

      const jwtConfig = getJwtConfig();
      expect(jwtConfig.secret).toBe('test-jwt-secret-key-for-testing-only-32-chars');
      expect(jwtConfig.expiresIn).toBe('30m');
    });
  });

  describe('getEmailConfig', () => {
    it('should return email configuration', () => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'test@test.com';
      process.env.SMTP_PASS = 'test-password';

      const emailConfig = getEmailConfig();
      expect(emailConfig.host).toBe('smtp.test.com');
      expect(emailConfig.port).toBe(587);
      expect(emailConfig.secure).toBe(false);
      expect(emailConfig.auth.user).toBe('test@test.com');
      expect(emailConfig.auth.pass).toBe('test-password');
    });

    it('should set secure to true for port 465', () => {
      process.env.SMTP_PORT = '465';

      const emailConfig = getEmailConfig();
      expect(emailConfig.secure).toBe(true);
    });
  });

  describe('Environment checks', () => {
    it('should detect production environment', () => {
      process.env.NODE_ENV = 'production';

      expect(isProduction()).toBe(true);
      expect(isDevelopment()).toBe(false);
    });

    it('should detect development environment', () => {
      process.env.NODE_ENV = 'development';

      expect(isProduction()).toBe(false);
      expect(isDevelopment()).toBe(true);
    });
  });
});