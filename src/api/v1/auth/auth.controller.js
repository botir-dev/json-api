// src/api/v1/auth/auth.controller.js
import { authService } from './auth.service.js';
import { registerZod, loginZod, refreshZod, changePasswordZod } from './auth.validators.js';
import { AppError } from '../../../core/errors/handler.js';

function parseAndValidate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    throw AppError.badRequest('Validation failed', details);
  }
  return result.data;
}

export const authController = {
  async register(request, reply) {
    const data = parseAndValidate(registerZod, request.body);
    const user = await authService.register(data);
    return reply.status(201).send({ success: true, data: user });
  },

  async login(request, reply) {
    const data = parseAndValidate(loginZod, request.body);
    const result = await authService.login(data, {
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
          tokenType: result.tokenType,
        },
      },
    });
  },

  async refresh(request, reply) {
    const data = parseAndValidate(refreshZod, request.body);
    const tokens = await authService.refresh(data.refreshToken);
    return reply.send({ success: true, data: tokens });
  },

  async logout(request, reply) {
    const { refreshToken } = request.body || {};
    await authService.logout(request.user.id, refreshToken);
    return reply.send({ success: true, message: 'Logged out successfully' });
  },

  async logoutAll(request, reply) {
    await authService.logoutAll(request.user.id);
    return reply.send({ success: true, message: 'Logged out from all devices' });
  },

  async me(request, reply) {
    const user = await authService.getProfile(request.user.id);
    return reply.send({ success: true, data: user });
  },

  async changePassword(request, reply) {
    const data = parseAndValidate(changePasswordZod, request.body);
    await authService.changePassword(
      request.user.id,
      data.currentPassword,
      data.newPassword
    );
    return reply.send({ success: true, message: 'Password changed successfully' });
  },
};
