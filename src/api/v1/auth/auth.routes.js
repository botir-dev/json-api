// src/api/v1/auth/auth.routes.js
import { authController } from './auth.controller.js';
import { authenticate } from '../../../core/middleware/authenticate.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
} from './auth.validators.js';

export default async function authRoutes(app) {
  app.post('/register', {
    schema: {
      tags: ['Auth'],
      summary: 'Register a new user',
      body: registerSchema,
    },
  }, authController.register);

  app.post('/login', {
    schema: {
      tags: ['Auth'],
      summary: 'Login with email and password',
      body: loginSchema,
    },
  }, authController.login);

  app.post('/refresh', {
    schema: {
      tags: ['Auth'],
      summary: 'Refresh access token',
      body: refreshSchema,
    },
  }, authController.refresh);

  app.post('/logout', {
    onRequest: [authenticate],
    schema: {
      tags: ['Auth'],
      summary: 'Logout and revoke refresh token',
      security: [{ bearerAuth: [] }],
    },
  }, authController.logout);

  app.post('/logout-all', {
    onRequest: [authenticate],
    schema: {
      tags: ['Auth'],
      summary: 'Logout from all devices',
      security: [{ bearerAuth: [] }],
    },
  }, authController.logoutAll);

  app.get('/me', {
    onRequest: [authenticate],
    schema: {
      tags: ['Auth'],
      summary: 'Get current authenticated user',
      security: [{ bearerAuth: [] }],
    },
  }, authController.me);

  app.put('/change-password', {
    onRequest: [authenticate],
    schema: {
      tags: ['Auth'],
      summary: 'Change password',
      body: changePasswordSchema,
      security: [{ bearerAuth: [] }],
    },
  }, authController.changePassword);
}
