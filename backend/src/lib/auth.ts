import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions, VerifyOptions, JwtPayload, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { getJwtConfig } from './config';
import crypto from 'crypto';

/**
 * Password hashing utilities
 */
export class PasswordService {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error(`Password verification failed: ${error.message}`);
    }
  }

  /**
   * Generate a secure random password
   */
  static generateSecurePassword(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one character from each required category
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += uppercase[crypto.randomInt(uppercase.length)];
    password += numbers[crypto.randomInt(numbers.length)];
    password += symbols[crypto.randomInt(symbols.length)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[crypto.randomInt(charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => crypto.randomInt(2) - 0.5).join('');
  }
}

/**
 * JWT token utilities
 */
export class TokenService {
  private static config = getJwtConfig();

  /**
   * Generate JWT token
   */
  static generateToken(payload: object): string {
    try {
      return jwt.sign(payload, this.config.secret as Secret, {
        expiresIn: this.config.expiresIn,
        issuer: 'jamalert-system',
        audience: 'jamalert-users',
      } as SignOptions);
    } catch (error: any) {
      throw new Error(`Token generation failed: ${error.message}`);
    }
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JwtPayload {
    try {
      // Our tokens are always signed with an object payload, so cast to JwtPayload
      return jwt.verify(token, this.config.secret as Secret, {
        issuer: 'jamalert-system',
        audience: 'jamalert-users',
      } as VerifyOptions) as JwtPayload;
    } catch (error: any) {
      if (error instanceof TokenExpiredError) {
        throw new Error('Token has expired');
      } else if (error instanceof JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        throw new Error(`Token verification failed: ${error.message}`);
      }
    }
  }

  /**
   * Generate refresh token (longer expiry)
   */
  static generateRefreshToken(payload: object): string {
    try {
      return jwt.sign(payload, this.config.secret as Secret, {
        expiresIn: '7d', // 7 days for refresh token
        issuer: 'jamalert-system',
        audience: 'jamalert-refresh',
      } as SignOptions);
    } catch (error: any) {
      throw new Error(`Refresh token generation failed: ${error.message}`);
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.config.secret as Secret, {
        issuer: 'jamalert-system',
        audience: 'jamalert-refresh',
      } as VerifyOptions) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Get token payload without verification (for debugging)
   */
  static decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }
}

/**
 * Session management utilities
 */
export class SessionService {
  private static sessions: Map<string, {
    userId: string;
    createdAt: Date;
    lastAccessed: Date;
    data: any;
  }> = new Map();

  /**
   * Create a new session
   */
  static createSession(userId: string, data: any = {}): string {
    const sessionId = this.generateSessionId();
    const now = new Date();
    
    this.sessions.set(sessionId, {
      userId,
      createdAt: now,
      lastAccessed: now,
      data,
    });

    return sessionId;
  }

  /**
   * Get session data
   */
  static getSession(sessionId: string): any | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Update last accessed time
    session.lastAccessed = new Date();
    return session;
  }

  /**
   * Update session data
   */
  static updateSession(sessionId: string, data: any): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.data = { ...session.data, ...data };
    session.lastAccessed = new Date();
    return true;
  }

  /**
   * Delete session
   */
  static deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Clean up expired sessions
   */
  static cleanupExpiredSessions(maxAgeMs: number = 30 * 60 * 1000): number {
    const now = new Date();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now.getTime() - session.lastAccessed.getTime() > maxAgeMs) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Generate secure session ID
   */
  private static generateSessionId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = 32;
    for (let i = 0; i < length; i++) {
      result += chars.charAt(crypto.randomInt(chars.length));
    }
    return result;
  }

  /**
   * Get all sessions for a user
   */
  static getUserSessions(userId: string): string[] {
    const userSessions: string[] = [];
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        userSessions.push(sessionId);
      }
    }

    return userSessions;
  }

  /**
   * Delete all sessions for a user
   */
  static deleteUserSessions(userId: string): number {
    let deleted = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        deleted++;
      }
    }

    return deleted;
  }
}

/**
 * Authentication middleware utilities
 */
export class AuthMiddleware {
  /**
   * Validate admin token and return admin user data
   */
  static async validateAdminToken(authHeader: string | null): Promise<any | null> {
    const token = TokenService.extractTokenFromHeader(authHeader);
    if (!token) {
      return null;
    }

    try {
      const payload = TokenService.verifyToken(token);
      
      // Verify this is an admin token
      if (payload.type !== 'admin') {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate user token and return user data
   */
  static async validateUserToken(authHeader: string | null): Promise<any | null> {
    const token = TokenService.extractTokenFromHeader(authHeader);
    if (!token) {
      return null;
    }

    try {
      const payload = TokenService.verifyToken(token);
      
      // Verify this is a user token
      if (payload.type !== 'user') {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate admin login token
   */
  static generateAdminToken(adminUser: { id: string; email: string; role: string }): string {
    return TokenService.generateToken({
      type: 'admin',
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });
  }

  /**
   * Generate user token (for future user authentication)
   */
  static generateUserToken(user: { id: string; email: string }): string {
    return TokenService.generateToken({
      type: 'user',
      userId: user.id,
      email: user.email,
    });
  }
}
