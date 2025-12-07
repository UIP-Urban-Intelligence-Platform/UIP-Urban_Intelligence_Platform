<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Backend-Guide.md
Module: Backend Development Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Comprehensive guide for backend development with Node.js/Express.
============================================================================
-->
# 🔧 Backend Guide

Express + TypeScript + Socket.IO backend documentation.

---

## 📊 Overview

The backend is a RESTful API server with real-time capabilities:

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x | Runtime |
| Express | 4.x | Web Framework |
| TypeScript | 5.x | Type Safety |
| Socket.IO | 4.x | Real-time |
| Prisma | 5.x | ORM |
| Redis | 7.x | Cache |
| Jest | 29.x | Testing |
| Winston | 3.x | Logging |
| Zod | 3.x | Validation |

---

## 📁 Project Structure

```
apps/traffic-web-app/backend/
├── src/
│   ├── controllers/          # Route handlers
│   │   ├── cameraController.ts
│   │   ├── weatherController.ts
│   │   └── trafficController.ts
│   ├── services/             # Business logic
│   │   ├── cameraService.ts
│   │   ├── weatherService.ts
│   │   └── dataIntegrationService.ts
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── validator.ts
│   ├── routes/               # API routes
│   │   ├── index.ts
│   │   ├── cameras.ts
│   │   └── weather.ts
│   ├── socket/               # WebSocket handlers
│   │   └── index.ts
│   ├── models/               # Data models
│   ├── types/                # TypeScript types
│   ├── utils/                # Utilities
│   ├── config/               # Configuration
│   ├── validators/           # Zod schemas
│   └── app.ts                # Express app
├── prisma/
│   └── schema.prisma
├── tests/
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### Installation

```bash
cd apps/traffic-web-app/backend
npm install
```

### Environment Setup

```bash
cp .env.example .env
```

```env
# .env
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/traffic

# Redis
REDIS_URL=redis://localhost:6379

# External APIs
CAMERA_API_URL=http://localhost:8081/api
WEATHER_API_KEY=your-api-key

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

### Development

```bash
# Start dev server (watch mode)
npm run dev

# Server runs on http://localhost:5000
```

### Build & Production

```bash
npm run build
npm start
```

---

## 📡 API Routes

### Route Structure

```typescript
// src/routes/index.ts
import { Router } from 'express';
import cameraRoutes from './cameras';
import weatherRoutes from './weather';
import trafficRoutes from './traffic';

const router = Router();

router.use('/cameras', cameraRoutes);
router.use('/weather', weatherRoutes);
router.use('/traffic', trafficRoutes);

export default router;
```

### Camera Routes

```typescript
// src/routes/cameras.ts
import { Router } from 'express';
import { CameraController } from '../controllers/cameraController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { cameraSchema } from '../validators/camera';

const router = Router();
const controller = new CameraController();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', authenticate, validate(cameraSchema), controller.create);
router.put('/:id', authenticate, validate(cameraSchema), controller.update);
router.delete('/:id', authenticate, controller.delete);

export default router;
```

---

## 🎯 Controllers

### Controller Pattern

```typescript
// src/controllers/cameraController.ts
import { Request, Response, NextFunction } from 'express';
import { CameraService } from '../services/cameraService';

export class CameraController {
  private service = new CameraService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      
      const cameras = await this.service.findAll({
        page: Number(page),
        limit: Number(limit),
        status: status as string,
      });

      res.json({
        success: true,
        data: cameras.data,
        pagination: {
          page: cameras.page,
          limit: cameras.limit,
          total: cameras.total,
          pages: cameras.pages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const camera = await this.service.findById(req.params.id);
      
      if (!camera) {
        return res.status(404).json({
          success: false,
          error: 'Camera not found',
        });
      }

      res.json({ success: true, data: camera });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const camera = await this.service.create(req.body);
      res.status(201).json({ success: true, data: camera });
    } catch (error) {
      next(error);
    }
  };
}
```

---

## 💼 Services

### Service Pattern

```typescript
// src/services/cameraService.ts
import { PrismaClient } from '@prisma/client';
import { RedisClient } from '../utils/redis';
import { ExternalCameraAPI } from '../utils/externalApi';

const prisma = new PrismaClient();

export class CameraService {
  private redis = new RedisClient();
  private externalApi = new ExternalCameraAPI();

  async findAll(options: FindAllOptions) {
    const { page, limit, status } = options;
    const skip = (page - 1) * limit;

    // Check cache first
    const cacheKey = `cameras:${page}:${limit}:${status}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // Query database
    const [data, total] = await Promise.all([
      prisma.camera.findMany({
        where: status ? { status } : undefined,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.camera.count({
        where: status ? { status } : undefined,
      }),
    ]);

    const result = {
      data,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(result));

    return result;
  }

  async findById(id: string) {
    return prisma.camera.findUnique({
      where: { id },
      include: { location: true },
    });
  }

  async create(data: CreateCameraDTO) {
    const camera = await prisma.camera.create({ data });
    await this.invalidateCache();
    return camera;
  }

  private async invalidateCache() {
    const keys = await this.redis.keys('cameras:*');
    if (keys.length) await this.redis.del(...keys);
  }
}
```

---

## 🔒 Middleware

### Authentication

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
};
```

### Error Handler

```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
};
```

### Rate Limiter

```typescript
// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../utils/redis';

export const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
});
```

### Validation

```typescript
// src/middleware/validator.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: result.error.errors,
      });
    }
    
    req.body = result.data;
    next();
  };
};

// src/validators/camera.ts
import { z } from 'zod';

export const cameraSchema = z.object({
  name: z.string().min(1).max(100),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  status: z.enum(['active', 'inactive', 'maintenance']),
  type: z.string(),
});
```

---

## 🔌 WebSocket

### Socket.IO Setup

```typescript
// src/socket/index.ts
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';

export const initializeSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join room based on subscription
    socket.on('subscribe', (room: string) => {
      socket.join(room);
      logger.info(`${socket.id} joined room: ${room}`);
    });

    socket.on('unsubscribe', (room: string) => {
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Emit events from services
export const emitTrafficUpdate = (io: Server, data: TrafficData) => {
  io.to('traffic').emit('traffic:update', data);
};

export const emitAlert = (io: Server, alert: Alert) => {
  io.emit('alert:new', alert);
};
```

---

## 📊 Database (Prisma)

### Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Camera {
  id        String   @id @default(uuid())
  name      String
  lat       Float
  lng       Float
  status    CameraStatus @default(ACTIVE)
  type      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  readings  TrafficReading[]
}

enum CameraStatus {
  ACTIVE
  INACTIVE
  MAINTENANCE
}

model TrafficReading {
  id        String   @id @default(uuid())
  cameraId  String
  camera    Camera   @relation(fields: [cameraId], references: [id])
  vehicles  Int
  timestamp DateTime @default(now())
  metadata  Json?
}
```

### Migrations

```bash
# Create migration
npx prisma migrate dev --name init

# Apply migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

---

## 🗄️ Caching (Redis)

```typescript
// src/utils/redis.ts
import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL);

export class RedisClient {
  async get(key: string) {
    return redis.get(key);
  }

  async set(key: string, value: string) {
    return redis.set(key, value);
  }

  async setex(key: string, seconds: number, value: string) {
    return redis.setex(key, seconds, value);
  }

  async del(...keys: string[]) {
    return redis.del(...keys);
  }

  async keys(pattern: string) {
    return redis.keys(pattern);
  }
}
```

---

## 📝 Logging

```typescript
// src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'traffic-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

---

## 🧪 Testing

### Test Setup

```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database
  await prisma.trafficReading.deleteMany();
  await prisma.camera.deleteMany();
});
```

### Controller Tests

```typescript
// tests/controllers/camera.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Camera Controller', () => {
  it('GET /api/cameras returns cameras', async () => {
    const response = await request(app)
      .get('/api/cameras')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('POST /api/cameras creates camera', async () => {
    const camera = {
      name: 'Test Camera',
      lat: 10.8231,
      lng: 106.6297,
      status: 'active',
      type: 'traffic',
    };

    const response = await request(app)
      .post('/api/cameras')
      .set('Authorization', `Bearer ${testToken}`)
      .send(camera)
      .expect(201);

    expect(response.body.data.name).toBe(camera.name);
  });
});
```

### Running Tests

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
npm run test:cov   # Coverage report
```

---

## 🐳 Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 5000
CMD ["node", "dist/app.js"]
```

---

## 🔗 Related Pages

- [[Frontend-Guide]] - Frontend documentation
- [[API-Reference]] - API endpoints
- [[Docker-Services]] - Docker setup
