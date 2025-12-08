// Polyfill for crypto if needed (required by @nestjs/schedule)
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  try {
    console.log('Starting NestJS application...');
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      bodyParser: false, // Disable default body parser to configure our own
    });
    
    // Increase body size limit to 50MB for image uploads (base64 encoded images can be large)
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    app.use(cookieParser());

    // Serve uploaded files (e.g., pedagogical documents)
    app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
    
    // Set global prefix for all routes
    app.setGlobalPrefix('api');
    
    // Enable CORS for Angular frontend
    app.enableCors({
      origin: 'http://localhost:4200',
      credentials: true,
    });
    
    // Enable validation pipe for DTOs
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    await app.listen(3000);
    console.log('Application is running on: http://localhost:3000');
    console.log('API routes are available at: http://localhost:3000/api');
  } catch (error) {
    console.error('Error starting the application:', error);
    process.exit(1);
  }
}
bootstrap();

