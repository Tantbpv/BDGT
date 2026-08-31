import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { AllExceptionsFilter, HttpExceptionFilter } from '@repo/nestjs-shared';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api');

  // Order matters: last registered = highest priority.
  // HttpExceptionFilter runs first (catches 4xx/5xx HttpExceptions),
  // AllExceptionsFilter is the fallback for anything unhandled.
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  const port = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3003;
  await app.listen(port);
}

void bootstrap();
