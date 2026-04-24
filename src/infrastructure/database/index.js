// src/infrastructure/database/index.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../logger/index.js';

const globalPrisma = global.__prisma;

export const prisma = globalPrisma || new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// Logging hooks
prisma.$on('query', (e) => {
  if (process.env.LOG_LEVEL === 'debug') {
    logger.debug({ query: e.query, duration: `${e.duration}ms` }, 'DB Query');
  }
});

prisma.$on('error', (e) => {
  logger.error({ message: e.message }, 'DB Error');
});

prisma.$on('warn', (e) => {
  logger.warn({ message: e.message }, 'DB Warning');
});

export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
  } catch (err) {
    logger.error({ err }, '❌ Database connection failed');
    throw err;
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
