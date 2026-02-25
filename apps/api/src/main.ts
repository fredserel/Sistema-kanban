import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create app with Fastify adapter
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      trustProxy: true,
    }),
    {
      logger: ['error', 'warn', 'log', 'debug'],
    },
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT', 3001);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:3000');

  // Security - Helmet
  await app.register(require('@fastify/helmet'), {
    contentSecurityPolicy: nodeEnv === 'production',
  });

  // CORS
  await app.register(require('@fastify/cors'), {
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Compression
  await app.register(require('@fastify/compress'), {
    encodings: ['gzip', 'deflate'],
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger (development only)
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Kanban API')
      .setDescription('Sistema de Gerenciamento de Projetos Kanban')
      .setVersion('2.0')
      .addBearerAuth()
      .addTag('auth', 'Autenticação')
      .addTag('users', 'Gerenciamento de usuários')
      .addTag('roles', 'Gerenciamento de perfis')
      .addTag('permissions', 'Permissões')
      .addTag('projects', 'Gerenciamento de projetos')
      .addTag('stages', 'Gerenciamento de estágios')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(`Swagger: http://localhost:${port}/api/docs`);
  }

  // Start server (Fastify requires '0.0.0.0' for Docker)
  await app.listen(port, '0.0.0.0');
  logger.log(`API running on: http://localhost:${port}`);
  logger.log(`Environment: ${nodeEnv}`);
}

bootstrap();
