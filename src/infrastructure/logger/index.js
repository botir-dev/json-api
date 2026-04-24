// src/infrastructure/logger/index.js
import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isPretty = process.env.LOG_PRETTY === 'true';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(isPretty && !isProduction
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss.l',
            ignore: 'pid,hostname',
            messageFormat: '{levelLabel} - {msg}',
          },
        },
      }
    : {}),
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
  base: {
    env: process.env.NODE_ENV,
    service: process.env.APP_NAME || 'enterprise-api',
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-api-key"]',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.refreshToken',
    ],
    censor: '[REDACTED]',
  },
});
