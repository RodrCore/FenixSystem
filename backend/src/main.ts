import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // ✅ CORS - Permitir peticiones desde el frontend Angular
  app.enableCors({
    origin: [
      'http://localhost:4200', // Angular dev server
      'http://localhost:4201', // Por si usas otro puerto
      /^http:\/\/192\.168\.\d+\.\d+/, // ← acepta cualquier IP local
      'https://localhost', // ✅ AGREGAR — Capacitor Android
      'capacitor://localhost', // ✅ AGREGAR — Capacitor iOS
      'ionic://localhost', // ✅ AGREGAR — Ionic webview viejo
      /\.ngrok-free\.dev$/, // ✅ AGREGAR — cualquier subdominio ngrok
      /\.ngrok-free\.app$/, // ✅ AGREGAR — variante .app
      process.env.CORS_ORIGIN || 'https://fenixbd-demo.vercel.app',
      'https://fenix-system-6frx-git-main-rodr-corp.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'ngrok-skip-browser-warning'],
    credentials: true, // Permitir cookies/auth headers
  });

  // ✅ Prefijo global de API
  app.setGlobalPrefix('api');

  // ✅ Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no declaradas en DTOs
      forbidNonWhitelisted: true,
      transform: true, // Transforma tipos automáticamente
    }),
  );
  app.useWebSocketAdapter(new IoAdapter(app));
  await app.listen(3000);
}

bootstrap();
