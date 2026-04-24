// src/plugins/audit-log.plugin.js
/**
 * Audit Log Plugin
 *
 * A drop-in Fastify plugin that records mutating requests (POST/PUT/PATCH/DELETE)
 * with the authenticated user, route, and response status.
 *
 * Register in app.js:
 *   import auditLogPlugin from './plugins/audit-log.plugin.js';
 *   await app.register(auditLogPlugin);
 */

import fp from 'fastify-plugin';
import { logger } from '../infrastructure/logger/index.js';

async function auditLogPlugin(app, options = {}) {
  const {
    methods        = ['POST', 'PUT', 'PATCH', 'DELETE'],
    excludePaths   = ['/health', '/docs'],
    logBody        = false,
  } = options;

  app.addHook('onResponse', async (request, reply) => {
    if (!methods.includes(request.method)) return;
    if (excludePaths.some((p) => request.url.startsWith(p))) return;

    const auditEntry = {
      type:      'AUDIT',
      method:    request.method,
      path:      request.url,
      status:    reply.statusCode,
      userId:    request.user?.id ?? 'anonymous',
      userRole:  request.user?.role ?? null,
      ip:        request.ip,
      userAgent: request.headers['user-agent'],
      reqId:     request.id,
      duration:  reply.elapsedTime,
      timestamp: new Date().toISOString(),
      ...(logBody && request.body && { body: sanitizeBody(request.body) }),
    };

    logger.info(auditEntry, 'Audit log');
    // In production: persist to an audit_logs table or external SIEM
  });
}

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;
  const redacted = ['password', 'passwordHash', 'token', 'secret', 'apiKey'];
  return Object.fromEntries(
    Object.entries(body).map(([k, v]) =>
      redacted.some((r) => k.toLowerCase().includes(r)) ? [k, '[REDACTED]'] : [k, v]
    )
  );
}

export default fp(auditLogPlugin, {
  name: 'audit-log',
  fastify: '4.x',
});
