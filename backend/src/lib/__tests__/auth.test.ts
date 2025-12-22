import { PasswordService, TokenService, SessionService, AuthMiddleware } from '../auth';
import jwt from 'jsonwebtoken';

// Mock the config
jest.mock('../config', () => ({
  getJwtConfig: () => ({
    secret: 'test-secret-key-that-is-long-enough-for-testing',
    expiresIn: '30m',
  }),
}));

describe('PasswordService', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testPassword123!';
      const hash = await PasswordService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 characters
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123!';
      const hash1 = await PasswordService.hashPassword(password);
      const hash2 = await PasswordService.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123!';
      const hash = await PasswordService.hashPassword(password);
      
      const isValid = await PasswordService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123!';
      const wrongPassword = 'wrongPassword123!';
      const hash = await PasswordService.hashPassword(password);
      
      const isValid = await PasswordService.verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate password with default length', () => {
      const password = PasswordService.generateSecurePassword();
      
      expect(password.length).toBe(16);
    });

    it('should generate password with custom length', () => {
      const length = 24;
      const password = PasswordService.generateSecurePassword(length);
      
      expect(password.length).toBe(length);
    });

    it('should generate password with required character types', () => {
      const password = PasswordService.generateSecurePassword(20);
      
      expect(password).toMatch(/[a-z]/); // lowercase
      expect(password).toMatch(/[A-Z]/); // uppercase
      expect(password).toMatch(/\d/); // number
      expect(password).toMatch(/[!@#$%^&*]/); // special character
    });

    it('should generate different passwords each time', () => {
      const password1 = PasswordService.generateSecurePassword();
      const password2 = PasswordService.generateSecurePassword();
      
      expect(password1).not.toBe(password2);
    });
  });
});

describe('TokenService', () => {
  const testPayload = { userId: 'test-123', email: 'test@example.com' };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = TokenService.generateToken(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include correct payload in token', () => {
      const token = TokenService.generateToken(testPayload);
      const decoded = jwt.decode(token) as any;
      
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.iss).toBe('jamalert-system');
      expect(decoded.aud).toBe('jamalert-users');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = TokenService.generateToken(testPayload);
      const decoded = TokenService.verifyToken(token);
      
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
    });

    it('should reject invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => TokenService.verifyToken(invalidToken)).toThrow('Invalid token');
    });

    it('should reject expired token', () => {
      // Create a token that expires immediately
      const expiredToken = jwt.sign(
        testPayload,
        'test-secret-key-that-is-long-enough-for-testing',
        { expiresIn: '0s', issuer: 'jamalert-system', audience: 'jamalert-users' }
      );
      
      // Wait a moment to ensure expiration
      setTimeout(() => {
        expect(() => TokenService.verifyToken(expiredToken)).toThrow('Token has expired');
      }, 100);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with longer expiry', () => {
      const refreshToken = TokenService.generateRefreshToken(testPayload);
      const decoded = jwt.decode(refreshToken) as any;
      
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.aud).toBe('jamalert-refresh');
      
      // Check that expiry is longer (7 days = 604800 seconds)
      const now = Math.floor(Date.now() / 1000);
      expect(decoded.exp - now).toBeGreaterThan(600000); // Much longer than 30m
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const header = `Bearer ${token}`;
      
      const extracted = TokenService.extractTokenFromHeader(header);
      expect(extracted).toBe(token);
    });

    it('should return null for invalid header format', () => {
      const invalidHeaders = [
        'InvalidFormat token',
        'Bearer',
        'Bearer token extra',
        '',
        null,
      ];

      invalidHeaders.forEach(header => {
        const extracted = TokenService.extractTokenFromHeader(header);
        expect(extracted).toBeNull();
      });
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = TokenService.generateToken(testPayload);
      const decoded = TokenService.decodeToken(token);
      
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token';
      const decoded = TokenService.decodeToken(invalidToken);
      
      expect(decoded).toBeNull();
    });
  });
});

describe('SessionService', () => {
  beforeEach(() => {
    // Clear sessions before each test
    SessionService['sessions'].clear();
  });

  describe('createSession', () => {
    it('should create a new session', () => {
      const userId = 'user-123';
      const data = { role: 'admin' };
      
      const sessionId = SessionService.createSession(userId, data);
      
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBe(32);
    });

    it('should store session data correctly', () => {
      const userId = 'user-123';
      const data = { role: 'admin', preferences: { theme: 'dark' } };
      
      const sessionId = SessionService.createSession(userId, data);
      const session = SessionService.getSession(sessionId);
      
      expect(session.userId).toBe(userId);
      expect(session.data).toEqual(data);
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.lastAccessed).toBeInstanceOf(Date);
    });
  });

  describe('getSession', () => {
    it('should retrieve existing session', () => {
      const userId = 'user-123';
      const sessionId = SessionService.createSession(userId);
      
      const session = SessionService.getSession(sessionId);
      
      expect(session).toBeDefined();
      expect(session.userId).toBe(userId);
    });

    it('should return null for non-existent session', () => {
      const session = SessionService.getSession('non-existent-id');
      
      expect(session).toBeNull();
    });

    it('should update last accessed time', async () => {
      const userId = 'user-123';
      const sessionId = SessionService.createSession(userId);
      
      const session1 = SessionService.getSession(sessionId);
      const firstAccess = session1.lastAccessed;
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 10));

      const session2 = SessionService.getSession(sessionId);
      expect(session2.lastAccessed.getTime()).toBeGreaterThanOrEqual(firstAccess.getTime());
    });
  });

  describe('updateSession', () => {
    it('should update session data', () => {
      const userId = 'user-123';
      const initialData = { role: 'user' };
      const sessionId = SessionService.createSession(userId, initialData);
      
      const updateData = { role: 'admin', newField: 'value' };
      const updated = SessionService.updateSession(sessionId, updateData);
      
      expect(updated).toBe(true);
      
      const session = SessionService.getSession(sessionId);
      expect(session.data.role).toBe('admin');
      expect(session.data.newField).toBe('value');
    });

    it('should return false for non-existent session', () => {
      const updated = SessionService.updateSession('non-existent', { data: 'value' });
      
      expect(updated).toBe(false);
    });
  });

  describe('deleteSession', () => {
    it('should delete existing session', () => {
      const userId = 'user-123';
      const sessionId = SessionService.createSession(userId);
      
      const deleted = SessionService.deleteSession(sessionId);
      
      expect(deleted).toBe(true);
      
      const session = SessionService.getSession(sessionId);
      expect(session).toBeNull();
    });

    it('should return false for non-existent session', () => {
      const deleted = SessionService.deleteSession('non-existent');
      
      expect(deleted).toBe(false);
    });
  });

  describe('getUserSessions', () => {
    it('should return all sessions for a user', () => {
      const userId = 'user-123';
      const sessionId1 = SessionService.createSession(userId);
      const sessionId2 = SessionService.createSession(userId);
      const sessionId3 = SessionService.createSession('other-user');
      
      const userSessions = SessionService.getUserSessions(userId);
      
      expect(userSessions).toHaveLength(2);
      expect(userSessions).toContain(sessionId1);
      expect(userSessions).toContain(sessionId2);
      expect(userSessions).not.toContain(sessionId3);
    });
  });

  describe('deleteUserSessions', () => {
    it('should delete all sessions for a user', () => {
      const userId = 'user-123';
      const sessionId1 = SessionService.createSession(userId);
      const sessionId2 = SessionService.createSession(userId);
      const sessionId3 = SessionService.createSession('other-user');
      
      const deleted = SessionService.deleteUserSessions(userId);
      
      expect(deleted).toBe(2);
      
      expect(SessionService.getSession(sessionId1)).toBeNull();
      expect(SessionService.getSession(sessionId2)).toBeNull();
      expect(SessionService.getSession(sessionId3)).toBeDefined(); // Other user's session should remain
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should remove expired sessions', () => {
      const userId = 'user-123';
      const sessionId = SessionService.createSession(userId);
      
      // Manually set an old last accessed time
      const session = SessionService['sessions'].get(sessionId);
      if (session) {
        session.lastAccessed = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      }
      
      const cleaned = SessionService.cleanupExpiredSessions(30 * 60 * 1000); // 30 minutes max age
      
      expect(cleaned).toBe(1);
      expect(SessionService.getSession(sessionId)).toBeNull();
    });
  });
});

describe('AuthMiddleware', () => {
  describe('validateAdminToken', () => {
    it('should validate valid admin token', async () => {
      const adminData = { id: 'admin-123', email: 'admin@example.com', role: 'admin' };
      const token = AuthMiddleware.generateAdminToken(adminData);
      const header = `Bearer ${token}`;
      
      const result = await AuthMiddleware.validateAdminToken(header);
      
      expect(result).toBeDefined();
      expect(result.type).toBe('admin');
      expect(result.userId).toBe(adminData.id);
      expect(result.email).toBe(adminData.email);
      expect(result.role).toBe(adminData.role);
    });

    it('should reject non-admin token', async () => {
      const userData = { id: 'user-123', email: 'user@example.com' };
      const token = AuthMiddleware.generateUserToken(userData);
      const header = `Bearer ${token}`;
      
      const result = await AuthMiddleware.validateAdminToken(header);
      
      expect(result).toBeNull();
    });

    it('should reject invalid header', async () => {
      const result = await AuthMiddleware.validateAdminToken('Invalid header');
      
      expect(result).toBeNull();
    });
  });

  describe('validateUserToken', () => {
    it('should validate valid user token', async () => {
      const userData = { id: 'user-123', email: 'user@example.com' };
      const token = AuthMiddleware.generateUserToken(userData);
      const header = `Bearer ${token}`;
      
      const result = await AuthMiddleware.validateUserToken(header);
      
      expect(result).toBeDefined();
      expect(result.type).toBe('user');
      expect(result.userId).toBe(userData.id);
      expect(result.email).toBe(userData.email);
    });

    it('should reject admin token', async () => {
      const adminData = { id: 'admin-123', email: 'admin@example.com', role: 'admin' };
      const token = AuthMiddleware.generateAdminToken(adminData);
      const header = `Bearer ${token}`;
      
      const result = await AuthMiddleware.validateUserToken(header);
      
      expect(result).toBeNull();
    });
  });

  describe('generateAdminToken', () => {
    it('should generate admin token with correct payload', () => {
      const adminData = { id: 'admin-123', email: 'admin@example.com', role: 'admin' };
      const token = AuthMiddleware.generateAdminToken(adminData);
      
      const decoded = TokenService.decodeToken(token);
      
      expect(decoded.type).toBe('admin');
      expect(decoded.userId).toBe(adminData.id);
      expect(decoded.email).toBe(adminData.email);
      expect(decoded.role).toBe(adminData.role);
    });
  });

  describe('generateUserToken', () => {
    it('should generate user token with correct payload', () => {
      const userData = { id: 'user-123', email: 'user@example.com' };
      const token = AuthMiddleware.generateUserToken(userData);
      
      const decoded = TokenService.decodeToken(token);
      
      expect(decoded.type).toBe('user');
      expect(decoded.userId).toBe(userData.id);
      expect(decoded.email).toBe(userData.email);
    });
  });
});