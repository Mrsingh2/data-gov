import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as express from 'express';

const server = express();

let app: any;

async function bootstrap() {
  if (!app) {
    const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'error', 'warn'],
    });

    nestApp.setGlobalPrefix('api');
    nestApp.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    nestApp.enableCors({
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
    });

    await nestApp.init();
    app = server;
  }
  return app;
}

export default async function handler(req: any, res: any) {
  const expressApp = await bootstrap();
  expressApp(req, res);
}
