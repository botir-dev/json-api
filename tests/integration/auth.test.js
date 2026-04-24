// tests/integration/auth.test.js
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { buildApp } from '../../src/app.js';

let app;
let accessToken;
let refreshToken;

const testUser = {
  email:     `test_${Date.now()}@example.com`,
  username:  `testuser_${Date.now()}`,
  password:  'TestPass1!',
  firstName: 'Test',
  lastName:  'User',
};

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('POST /api/v1/auth/register', () => {
  it('registers a new user successfully', async () => {
    const res = await app.inject({
      method: 'POST',
      url:    '/api/v1/auth/register',
      body:   testUser,
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.email).toBe(testUser.email);
    expect(body.data.passwordHash).toBeUndefined(); // never exposed
  });

  it('rejects duplicate email with 409', async () => {
    const res = await app.inject({
      method: 'POST',
      url:    '/api/v1/auth/register',
      body:   testUser,
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('CONFLICT');
  });

  it('rejects weak password with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url:    '/api/v1/auth/register',
      body:   { ...testUser, email: 'new@test.com', username: 'newuser99', password: 'weak' },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('BAD_REQUEST');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url:    '/api/v1/auth/login',
      body:   { email: testUser.email, password: testUser.password },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.tokens.accessToken).toBeDefined();
    expect(body.data.tokens.refreshToken).toBeDefined();

    accessToken  = body.data.tokens.accessToken;
    refreshToken = body.data.tokens.refreshToken;
  });

  it('rejects wrong password with 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url:    '/api/v1/auth/login',
      body:   { email: testUser.email, password: 'WrongPass999!' },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('UNAUTHORIZED');
  });

  it('rejects unknown email with 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url:    '/api/v1/auth/login',
      body:   { email: 'nobody@nowhere.com', password: 'SomePass1!' },
    });

    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns current user profile with valid token', async () => {
    const res = await app.inject({
      method:  'GET',
      url:     '/api/v1/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.email).toBe(testUser.email);
  });

  it('returns 401 with no token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/auth/me' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 with malformed token', async () => {
    const res = await app.inject({
      method:  'GET',
      url:     '/api/v1/auth/me',
      headers: { authorization: 'Bearer not.a.real.token' },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('issues a new access token from refresh token', async () => {
    const res = await app.inject({
      method: 'POST',
      url:    '/api/v1/auth/refresh',
      body:   { refreshToken },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.accessToken).toBeDefined();
    // Old refresh token should be rotated
    refreshToken = body.data.refreshToken;
  });

  it('rejects an already-used refresh token', async () => {
    // The token used above was rotated — reuse the old one
    const res = await app.inject({
      method: 'POST',
      url:    '/api/v1/auth/refresh',
      body:   { refreshToken: 'old-revoked-token-id' },
    });

    expect(res.statusCode).toBe(401);
  });
});
