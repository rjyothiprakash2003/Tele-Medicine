import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { validateEnv } from './config/env';

async function bootstrap() {
  const env = validateEnv(process.env);
  const app = await NestFactory.create(AppModule, { rawBody: false });

  app.setGlobalPrefix(env.API_PREFIX);
  app.use(cookieParser(env.SESSION_SECRET));
  app.enableCors({
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swagger = new DocumentBuilder()
    .setTitle('TELEMEDICINE AI API')
    .setDescription(
      'AI-first healthcare information platform. No human-doctor module. AI-generated prescription records are not legally valid prescriptions.',
    )
    .setVersion('1.0.0')
    .addCookieAuth(env.SESSION_COOKIE_NAME)
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  await app.listen(env.PORT);
  // eslint-disable-next-line no-console
  console.log(`TELEMEDICINE AI API listening on :${env.PORT}/${env.API_PREFIX}`);
}

bootstrap();
