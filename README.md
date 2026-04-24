# 🏢 Enterprise API

A production-ready, scalable REST API built with **Fastify**, **PostgreSQL** (Prisma ORM), and **Redis**.

---

## ✨ Feature Overview

| Feature | Status |
|---|---|
| Clean Architecture (Controller → Service → Repository) | ✅ |
| Full CRUD with Zod validation | ✅ |
| JWT access + refresh token auth | ✅ |
| Role-based access control (ADMIN / USER / MODERATOR) | ✅ |
| Soft delete + restore | ✅ |
| UUID primary keys + timestamps | ✅ |
| Redis caching with cache-aside pattern | ✅ |
| Pagination, sorting, filtering, full-text search | ✅ |
| Rate limiting | ✅ |
| Swagger / OpenAPI docs | ✅ |
| Structured logging (Pino) | ✅ |
| Domain events + webhook dispatch | ✅ |
| API key authentication | ✅ |
| CORS, Helmet, input sanitization | ✅ |
| Docker + Docker Compose | ✅ |
| Seed script with realistic fake data | ✅ |

---

## 📁 Project Structure

```
enterprise-api/
├── src/
│   ├── server.js                   # Entry point
│   ├── app.js                      # Fastify app builder, plugins, routes
│   │
│   ├── api/v1/                     # Versioned API modules
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.validators.js
│   │   ├── users/
│   │   │   ├── users.routes.js
│   │   │   ├── users.controller.js
│   │   │   ├── users.service.js
│   │   │   └── users.repository.js
│   │   ├── products/
│   │   │   ├── products.routes.js
│   │   │   ├── products.controller.js
│   │   │   ├── products.service.js
│   │   │   ├── products.repository.js
│   │   │   └── products.validators.js
│   │   ├── orders/
│   │   │   ├── orders.routes.js
│   │   │   ├── orders.controller.js
│   │   │   ├── orders.service.js
│   │   │   └── orders.validators.js
│   │   └── webhooks/
│   │       ├── webhooks.routes.js
│   │       └── webhooks.service.js
│   │
│   ├── core/
│   │   ├── errors/
│   │   │   ├── handler.js          # Centralized error handler + AppError class
│   │   │   └── not-found.js
│   │   ├── middleware/
│   │   │   ├── authenticate.js     # JWT + API key middleware
│   │   │   └── query-parser.js     # Pagination / filter parsing
│   │   └── events/
│   │       └── emitter.js          # Domain event emitter + webhook dispatch
│   │
│   ├── infrastructure/
│   │   ├── database/index.js       # Prisma client singleton
│   │   ├── cache/index.js          # Redis / ioredis wrapper
│   │   └── logger/index.js         # Pino logger
│   │
│   └── shared/
│       └── utils/slugify.js
│
├── prisma/
│   └── schema.prisma               # All DB models
│
├── scripts/
│   └── seed.js                     # Faker-based seed data
│
├── docker/
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
└── package.json
```

---

## 🚀 Quick Start

### Option 1: Docker (recommended)

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env with your secrets

# 2. Start all services (API + PostgreSQL + Redis)
docker-compose up -d

# 3. Run migrations and seed
docker-compose exec api npx prisma migrate deploy
docker-compose exec api node scripts/seed.js
```

### Option 2: Local Development

**Prerequisites:** Node.js 20+, PostgreSQL 15+, Redis 7+

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit DATABASE_URL and Redis/JWT settings

# 3. Run migrations
npm run db:migrate

# 4. Generate Prisma client
npm run db:generate

# 5. Seed the database
npm run db:seed

# 6. Start dev server (with file watching)
npm run dev
```

The API will be available at `http://localhost:3000`

---

## 📚 API Reference

### Base URLs
- **Development:** `http://localhost:3000/api/v1`
- **Swagger UI:**  `http://localhost:3000/docs`

### Authentication

All protected routes require a JWT Bearer token:
```
Authorization: Bearer <access_token>
```

Or optionally an API key:
```
X-API-Key: sk_dev_<your_key>
```

---

## 🔑 Example Request / Response

### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "jane@example.com",
  "username": "jane_doe",
  "password": "SecurePass1",
  "firstName": "Jane",
  "lastName": "Doe"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "jane@example.com",
    "username": "jane_doe",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "USER",
    "isActive": true,
    "isEmailVerified": false,
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

---

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@enterprise.com",
  "password": "Admin1234!"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "admin@enterprise.com", "role": "ADMIN" },
    "tokens": {
      "accessToken":  "eyJhbG...",
      "refreshToken": "a8f3c2d1-...",
      "expiresIn":    900,
      "tokenType":    "Bearer"
    }
  }
}
```

---

### List Products (with filters)
```http
GET /api/v1/products?page=1&limit=10&search=laptop&sortBy=price&sortDir=asc&minPrice=100&maxPrice=2000&inStock=true
```

**Response 200:**
```json
{
  "success": true,
  "data": [ { "id": "...", "name": "Pro Laptop 15", "price": "999.00", ... } ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### Create Order
```http
POST /api/v1/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    { "productId": "550e8400-...", "quantity": 2 },
    { "productId": "661f9511-...", "quantity": 1 }
  ],
  "shippingAddress": {
    "fullName": "Jane Doe",
    "address1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "US"
  }
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "orderNumber": "ORD-M8X2K-AB3C",
    "status": "PENDING",
    "subtotal": "1499.00",
    "tax": "149.90",
    "shippingCost": "0.00",
    "total": "1648.90",
    "items": [ ... ]
  }
}
```

---

### Error Response Format
All errors return a consistent structure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "statusCode": 400,
    "details": [
      { "field": "email", "message": "Invalid email address" }
    ]
  }
}
```

---

## 🛡️ Order State Machine

```
PENDING → PROCESSING → SHIPPED → DELIVERED
   ↓           ↓
CANCELLED   CANCELLED
```

---

## 🔗 Webhook Events

Register a webhook endpoint to receive real-time event notifications:

```http
POST /api/v1/webhooks
Authorization: Bearer <admin_token>

{
  "url": "https://your-server.com/webhooks",
  "events": ["order.created", "order.paid", "user.created"]
}
```

Each delivery is signed with `X-Webhook-Signature: sha256=<hmac>` for verification.

Available events: `user.created`, `user.updated`, `user.deleted`, `product.created`,
`product.updated`, `product.deleted`, `order.created`, `order.paid`, `order.shipped`,
`order.delivered`, `order.cancelled`

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `REDIS_URL` | ✅ | `redis://localhost:6379` | Redis connection URL |
| `JWT_ACCESS_SECRET` | ✅ | — | Min 32 chars |
| `JWT_REFRESH_SECRET` | ✅ | — | Min 32 chars |
| `JWT_ACCESS_EXPIRES_IN` | | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | | `7d` | Refresh token lifetime |
| `PORT` | | `3000` | Server port |
| `RATE_LIMIT_MAX` | | `100` | Requests per window |
| `RATE_LIMIT_WINDOW` | | `60000` | Window in ms |
| `LOG_LEVEL` | | `info` | debug/info/warn/error |
| `LOG_PRETTY` | | `false` | Pretty print logs |
| `ENABLE_SWAGGER` | | `true` | Enable Swagger UI |
| `ENABLE_API_KEYS` | | `true` | Enable API key auth |
| `MOCK_MODE` | | `false` | Return fake data |

---

## 🗄️ Database Management

```bash
npm run db:migrate      # Create + apply new migration
npm run db:migrate:prod # Deploy migrations (production)
npm run db:generate     # Re-generate Prisma client
npm run db:studio       # Open Prisma Studio GUI
npm run db:seed         # Seed with fake data
npm run db:reset        # Reset DB (dev only — destructive!)
```

---

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Start with dev tools (Adminer + Redis Commander)
docker-compose --profile dev up -d

# View logs
docker-compose logs -f api

# Run migrations inside container
docker-compose exec api npx prisma migrate deploy

# Open shell
docker-compose exec api sh
```

---

## 📈 Performance Notes

- **Redis cache-aside** on products (5 min TTL) and users (5 min TTL)
- **Automatic cache invalidation** on create/update/delete via `delPattern`
- **Prisma transactions** for order creation (atomic stock decrement)
- **Composite DB indexes** on frequently queried fields (`userId`, `status`, `slug`, `email`)
- **Soft deletes** via `deletedAt` — queries default to `WHERE deletedAt IS NULL`
- **Webhook retry avoidance** — webhooks with 5+ consecutive failures are auto-disabled

---

## 🔒 Security Checklist

- [x] Passwords hashed with bcrypt (12 rounds)
- [x] JWT tokens with short expiry (15 min access / 7 day refresh)
- [x] Refresh token rotation on every use
- [x] Helmet HTTP security headers
- [x] CORS whitelist
- [x] Rate limiting (100 req/min default)
- [x] `passwordHash` redacted from all responses and logs
- [x] Webhook payloads signed with HMAC-SHA256
- [x] Non-privileged Docker user (`apiuser`)
- [x] Input sanitized via Zod schemas before touching DB
