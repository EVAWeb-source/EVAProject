import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { evaSecurityMiddleware } from './common/security.middleware.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');

  const adapter = app.getHttpAdapter().getInstance();
  adapter.disable?.('x-powered-by');
  adapter.set?.('trust proxy', 1);

  const configuredOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    ...(process.env.CORS_ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  ].filter(Boolean) as string[];

  const allowedOrigins = new Set([
    'http://localhost:3000',
    'http://localhost:3001',
    'https://evaproject-production.up.railway.app',
    'https://eva-admin-production.up.railway.app',
    ...configuredOrigins,
  ]);

  app.enableCors({
    origin(
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by EVA API CORS policy'), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key'],
    maxAge: 600,
  });

  app.use(evaSecurityMiddleware);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      stopAtFirstError: true,
    }),
  );

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  console.log(`EVA API listening on port ${port}/api/v1`);
}

void bootstrap();
