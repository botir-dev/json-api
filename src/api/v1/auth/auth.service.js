// src/api/v1/auth/auth.service.js
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { prisma } from '../../../infrastructure/database/index.js';
import { cache } from '../../../infrastructure/cache/index.js';
import { AppError } from '../../../core/errors/handler.js';
import { eventEmitter, EVENTS } from '../../../core/events/emitter.js';
import { logger } from '../../../infrastructure/logger/index.js';

const SALT_ROUNDS = 12;

// Parse duration string like "7d", "15m", "1h" into milliseconds
function parseDuration(str) {
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const match = String(str).match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 86400000; // default 7 days
  return parseInt(match[1]) * (units[match[2]] || 86400000);
}

class AuthService {
  // JWT app reference - set during app initialization
  _app = null;

  setApp(app) {
    this._app = app;
  }

  /**
   * Register a new user.
   */
  async register(data) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
        deletedAt: null,
      },
    });

    if (existing) {
      const field = existing.email === data.email ? 'email' : 'username';
      throw AppError.conflict(`A user with this ${field} already exists`);
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
      },
      select: this._safeSelect(),
    });

    await eventEmitter.emitDomain(EVENTS.USER_CREATED, user);

    logger.info({ userId: user.id }, 'User registered');
    return user;
  }

  /**
   * Authenticate user and issue tokens.
   */
  async login(credentials, meta = {}) {
    const user = await prisma.user.findFirst({
      where: { email: credentials.email, deletedAt: null },
    });

    if (!user) throw AppError.unauthorized('Invalid email or password');
    if (!user.isActive) throw AppError.forbidden('Account is deactivated');

    const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isValidPassword) throw AppError.unauthorized('Invalid email or password');

    const tokens = await this._generateTokenPair(user, meta);

    // Update last login (fire-and-forget)
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {});

    await eventEmitter.emitDomain(EVENTS.USER_LOGIN, { id: user.id, email: user.email });

    return {
      user: this._sanitize(user),
      ...tokens,
    };
  }

  /**
   * Issue new access token from refresh token.
   */
  async refresh(refreshToken) {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.isRevoked) {
      throw AppError.unauthorized('Invalid refresh token');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw AppError.unauthorized('Refresh token has expired');
    }

    if (!tokenRecord.user.isActive || tokenRecord.user.deletedAt) {
      throw AppError.forbidden('Account is deactivated');
    }

    // Rotate: revoke old token, issue new pair
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    const tokens = await this._generateTokenPair(tokenRecord.user);
    return tokens;
  }

  /**
   * Revoke a specific refresh token.
   */
  async logout(userId, refreshToken) {
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { userId, token: refreshToken, isRevoked: false },
        data: { isRevoked: true },
      });
    }

    // Invalidate session cache
    await cache.set(`user:${userId}:session`, 'invalidated', 30);
  }

  /**
   * Revoke all refresh tokens for a user.
   */
  async logoutAll(userId) {
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    await cache.set(`user:${userId}:session`, 'invalidated', 60 * 60);
    logger.info({ userId }, 'User logged out from all devices');
  }

  /**
   * Get user profile by ID.
   */
  async getProfile(userId) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: this._safeSelect(),
    });
    if (!user) throw AppError.notFound('User');
    return user;
  }

  /**
   * Change password with old password verification.
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw AppError.badRequest('Current password is incorrect');

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Revoke all sessions for security
    await this.logoutAll(userId);
    await eventEmitter.emitDomain(EVENTS.USER_PASSWORD_CHANGED, { id: userId });
  }

  // ─── Private helpers ────────────────────────────────────────────

  async _generateTokenPair(user, meta = {}) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    // Sign JWT using the app's jwt plugin
    let accessToken;
    if (this._app) {
      accessToken = this._app.jwt.sign(payload, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
      });
    } else {
      // Fallback during tests / if app ref not set
      accessToken = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 900000 })).toString('base64');
    }

    // Refresh token (opaque random UUID stored in DB)
    const rawRefreshToken = randomUUID();
    const refreshDurationMs = parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || '7d');
    const expiresAt = new Date(Date.now() + refreshDurationMs);

    await prisma.refreshToken.create({
      data: {
        token: rawRefreshToken,
        userId: user.id,
        expiresAt,
        userAgent: meta.userAgent || null,
        ipAddress: meta.ipAddress || null,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 15 * 60, // seconds
      tokenType: 'Bearer',
    };
  }

  _sanitize(user) {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  _safeSelect() {
    return {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      avatarUrl: true,
      createdAt: true,
    };
  }
}

export const authService = new AuthService();
