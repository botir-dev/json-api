// src/plugins/request-context.plugin.js
/**
 * Request Context Plugin
 *
 * Adds X-Request-Id and X-Response-Time headers to every response.
 * Exposes request timing for monitoring.
 */

import fp from 'fastify-plugin';

async function requestContextPlugin(app) {
  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('X-Request-Id',     request.id);
    reply.header('X-Powered-By',     'Enterprise API');
    reply.header('X-Response-Time',  `${reply.elapsedTime?.toFixed(2) ?? 0}ms`);
    return payload;
  });
}

export default fp(requestContextPlugin, {
  name: 'request-context',
  fastify: '4.x',
});
