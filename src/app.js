// src/app.js
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import formbody from "@fastify/formbody";
import jwt from "@fastify/jwt";

import { logger } from "./infrastructure/logger/index.js";
import { errorHandler } from "./core/errors/handler.js";
import { notFoundHandler } from "./core/errors/not-found.js";
import auditLogPlugin from "./plugins/audit-log.plugin.js";
import requestContextPlugin from "./plugins/request-context.plugin.js";

// Route modules
import authRoutes from "./api/v1/auth/auth.routes.js";
import userRoutes from "./api/v1/users/users.routes.js";
import productRoutes from "./api/v1/products/products.routes.js";
import orderRoutes from "./api/v1/orders/orders.routes.js";
import webhookRoutes from "./api/v1/webhooks/webhooks.routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: false, // We use pino directly
    genReqId: () => crypto.randomUUID(),
    trustProxy: true,
  });

  // ─── Security ────────────────────────────────────────────────────
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: process.env.CORS_ORIGINS?.split(",") ?? "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await app.register(formbody);

  // ─── JWT (global - all routes can use request.jwtVerify()) ────────
  await app.register(jwt, {
    secret: process.env.JWT_ACCESS_SECRET || "fallback-secret-change-in-production-min-32-chars",
    sign: { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" },
    decode: { complete: true },
  });

  // ─── Rate Limiting ────────────────────────────────────────────────
  await app.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || "60000"),
    errorResponseBuilder: () => ({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests, please try again later.",
        statusCode: 429,
      },
    }),
  });

  // ─── Swagger Documentation ────────────────────────────────────────
  if (process.env.ENABLE_SWAGGER !== "false") {
    await app.register(swagger, {
      openapi: {
        info: {
          title: process.env.APP_NAME || "Enterprise API",
          description:
            "Production-ready Enterprise REST API with full CRUD, auth, caching, and event system",
          version: "1.0.0",
          contact: { name: "API Support", email: "api@enterprise.com" },
        },
        servers: [
          {
            url: process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`,
            description: "Current server",
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
            apiKey: { type: "apiKey", in: "header", name: "X-API-Key" },
          },
        },
        tags: [
          { name: "Auth", description: "Authentication & authorization" },
          { name: "Users", description: "User management" },
          { name: "Products", description: "Product catalog" },
          { name: "Orders", description: "Order management" },
          { name: "Webhooks", description: "Webhook subscriptions" },
        ],
      },
    });

    await app.register(swaggerUi, {
      routePrefix: "/docs",
      uiConfig: { docExpansion: "list", deepLinking: true },
    });
  }

  // ─── Plugins ──────────────────────────────────────────────────────
  await app.register(requestContextPlugin);
  await app.register(auditLogPlugin);

  // ─── Health Check ─────────────────────────────────────────────────
  app.get(
    "/health",
    {
      schema: {
        description: "Health check endpoint",
        tags: ["System"],
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              timestamp: { type: "string" },
              uptime: { type: "number" },
              version: { type: "string" },
            },
          },
        },
      },
    },
    async () => ({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "1.0.0",
      environment: process.env.NODE_ENV,
    }),
  );

  // ─── API Routes ───────────────────────────────────────────────────
  const V1_PREFIX = "/api/v1";

  await app.register(authRoutes, { prefix: `${V1_PREFIX}/auth` });
  await app.register(userRoutes, { prefix: `${V1_PREFIX}/users` });
  await app.register(productRoutes, { prefix: `${V1_PREFIX}/products` });
  await app.register(orderRoutes, { prefix: `${V1_PREFIX}/orders` });
  await app.register(webhookRoutes, { prefix: `${V1_PREFIX}/webhooks` });

  // ─── Error Handling ───────────────────────────────────────────────
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  return app;
}
