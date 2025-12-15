import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger } from '@vibe/shared-utils';

const logger = new Logger('BlogAPI');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Blog API')
    .setDescription('部落格系統 REST API 文檔')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', '用戶認證')
    .addTag('users', '用戶管理')
    .addTag('articles', '文章管理')
    .addTag('categories', '分類管理')
    .addTag('tags', '標籤管理')
    .addTag('comments', '評論管理')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.info(`🚀 Blog API is running on: http://localhost:${port}`);
  logger.info(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
