import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    console.log('Starting NestJS application...');
    const app = await NestFactory.create(AppModule);
    
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

