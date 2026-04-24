// src/server.js
import { buildApp } from './app.js';
import { logger } from './infrastructure/logger/index.js';
import { connectDatabase } from './infrastructure/database/index.js';
import { connectRedis } from './infrastructure/cache/index.js';
import { authService } from './api/v1/auth/auth.service.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function bootstrap() {
  try {
    // Connect to infrastructure
    await connectDatabase();
    await connectRedis();

    // Build and start Fastify app
    const app = await buildApp();

    // Pass app reference to authService for JWT signing
    authService.setApp(app);

    await app.listen({ port: PORT, host: HOST });

    logger.info(`🚀 Server running at http://${HOST}:${PORT}`);
    logger.info(`📚 Swagger docs at http://${HOST}:${PORT}/docs`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    process.exit(0);
  });
});

bootstrap();
