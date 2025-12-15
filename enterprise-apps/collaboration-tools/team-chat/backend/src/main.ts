import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { Logger } from '@vibe/shared-utils';

const logger = new Logger('TeamChatBackend');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // 安全性中間件
  app.use(helmet());

  // 壓縮響應
  app.use(compression());

  // CORS 配置
  app.enableCors({
    origin: configService.get('CORS_ORIGIN') || 'http://localhost:3000',
    credentials: true,
  });

  // 全局驗證管道
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

  // API 前綴
  app.setGlobalPrefix('api');

  const port = configService.get('PORT') || 3001;
  await app.listen(port);

  logger.info(`🚀 Team Chat Backend is running on: http://localhost:${port}/api`);
  logger.info(`🔌 WebSocket server is running on: ws://localhost:${port}`);
}

bootstrap();
